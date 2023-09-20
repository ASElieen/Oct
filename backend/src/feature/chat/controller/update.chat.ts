import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

import { MessageCache } from '@/shared/services/redis/message.cache'
import { markChatSchema } from '../scheme/chat.scheme'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { socketIOChatObject } from '@/shared/sockets/chat'
import { chatQueue } from '@/shared/services/queues/chat.queue'
import { IMessageData } from '../interfaces/chat.interface'

const messageCache: MessageCache = new MessageCache()

export class UpdateMessage {
  @joiValidation(markChatSchema)
  public async updateMessage(req: Request, resp: Response): Promise<void> {
    const { senderId, receiverId } = req.body
    const updatedMessage: IMessageData = await messageCache.updateChatMessages(`${senderId}`, `${receiverId}`)
    socketIOChatObject.emit('message read', updatedMessage)
    socketIOChatObject.emit('chat list', updatedMessage)
    chatQueue.addChatJob('markMessagesAsReadInDB', {
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId)
    })
    resp.status(HTTP_STATUS.OK).json({ message: '已将消息标记为已读' })
  }
}