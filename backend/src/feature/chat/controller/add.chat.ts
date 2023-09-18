import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import { UploadApiResponse } from 'cloudinary'

import { UserCache } from '@/shared/services/redis/user.cache'
import { IUserDocument } from '@/feature/user/interfaces/user.interface'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { addChatSchema } from '../scheme/chat.scheme'
import { cloudinaryUploads } from '@shared/global/helpers/cloudinaryUpload'
import { BadRequestError } from '@shared/global/helpers/errorHandler'
import { config } from '@/config'
import { IMessageData } from '../interfaces/chat.interface'
import { socketIOChatObject } from '@shared/sockets/chat'
import { IMessageNotification } from '../interfaces/chat.interface'
import { notificationTemplate } from '@shared/services/email/templates/notifications/notification.template'
import { mailQueue } from '@/shared/services/queues/email.queue'
import { MessageCache } from '@/shared/services/redis/message.cache'

const userCache: UserCache = new UserCache()
const messageCache: MessageCache = new MessageCache()

export class AddChat {
  @joiValidation(addChatSchema)
  public async addMessage(req: Request, resp: Response): Promise<void> {
    const {
      conversationId,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body,
      gifUrl,
      isRead,
      selectedImage
    } = req.body

    let fileUrl = ''
    const messageObjectId: ObjectId = new ObjectId()
    const conversationObjectId: ObjectId = !conversationId ? new ObjectId() : new mongoose.Types.ObjectId(conversationId)

    const sender: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument

    if (selectedImage.length) {
      const result: UploadApiResponse = (await cloudinaryUploads(
        req.body.image,
        req.currentUser!.userId,
        true,
        true
      )) as UploadApiResponse
      if (!result.public_id) {
        throw new BadRequestError(result.message)
      }
      fileUrl = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`
    }

    const messageData: IMessageData = {
      _id: `${messageObjectId}`,
      conversationId: new mongoose.Types.ObjectId(conversationObjectId),
      receiverId,
      receiverAvatarColor,
      receiverProfilePicture,
      receiverUsername,
      senderUsername: `${req.currentUser!.username}`,
      senderId: `${req.currentUser!.userId}`,
      senderAvatarColor: `${req.currentUser!.avatarColor}`,
      senderProfilePicture: `${sender.profilePicture}`,
      body,
      isRead,
      gifUrl,
      selectedImage: fileUrl,
      reaction: [],
      createdAt: new Date(),
      deleteForEveryone: false,
      deleteForMe: false
    }

    AddChat.prototype.emitSocketIOEvent(messageData)

    if (!isRead) {
      AddChat.prototype.messageNotification({
        currentUser: req.currentUser!,
        message: body,
        receiverName: receiverUsername,
        receiverId,
        messageData
      })
    }

    await messageCache.addChatListToCache(`${req.currentUser!.userId}`, `${receiverId}`, `${conversationObjectId}`)
    await messageCache.addChatListToCache(`${receiverId}`, `${req.currentUser!.userId}`, `${conversationObjectId}`)

    resp.status(HTTP_STATUS.OK).json({ message: '添加消息成功', conversationId: conversationObjectId })
  }

  private emitSocketIOEvent(data: IMessageData): void {
    socketIOChatObject.emit('message received', data)
    socketIOChatObject.emit('chat list', data)
  }

  private async messageNotification(messageData: IMessageNotification): Promise<void> {
    const { currentUser, message, receiverName, receiverId } = messageData
    const cachedUser = await userCache.getUserFromCache(`${receiverId}`)
    if (cachedUser?.notifications.messages) {
      const templateParams = {
        username: receiverName,
        message,
        header: `有一条来自${currentUser.username}的消息`
      }
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams)
      mailQueue.addEmailJob('directMessageEmail', {
        receiverEmail: cachedUser.email!,
        template,
        subject: `有一条来自${currentUser.username}的消息`
      })
    }
  }
}