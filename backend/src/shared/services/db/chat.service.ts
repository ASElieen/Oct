import { ObjectId } from 'mongodb'

import { IMessageData } from '@/feature/chat/interfaces/chat.interface'
import { IConversationDocument } from '@feature/chat/interfaces/conversation.interface'
import { ConversationModel } from '@/feature/chat/schema/conversation.schema'
import { MessageModel } from '@/feature/chat/schema/chat.schema'

class ChatService {
  public async addMessageToDB(data: IMessageData): Promise<void> {
    const conversations: IConversationDocument[] = await ConversationModel.find({ _id: data.conversationId }).exec()
    if (conversations.length === 0) {
      await ConversationModel.create({
        _id: data.conversationId,
        senderId: data.senderId,
        receiverId: data.receiverId
      })
    }

    await MessageModel.create({
      _id: data._id,
      conversationId: data.conversationId,
      receiverId: data.receiverId,
      receiverUsername: data.receiverUsername,
      receiverAvatarColor: data.receiverAvatarColor,
      receiverProfilePicture: data.receiverProfilePicture,
      senderUsername: data.senderUsername,
      senderId: data.senderId,
      senderAvatarColor: data.senderAvatarColor,
      senderProfilePicture: data.senderProfilePicture,
      body: data.body,
      isRead: data.isRead,
      gifUrl: data.gifUrl,
      selectedImage: data.selectedImage,
      reaction: data.reaction,
      createdAt: data.createdAt
    })
  }

  public async getUserConversationList(userId: ObjectId): Promise<IMessageData[]> {
    const messsages: IMessageData[] = await MessageModel.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      {
        $group: {
          _id: '$conversationId',
          //$$root拿到整个文档
          result: { $last: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: '$result._id',
          conversationId: '$result.conversationId',
          receiverId: '$result.receiverId',
          receiverUsername: '$result.receiverUsername',
          receiverAvatarColor: '$result.receiverAvatarColor',
          receiverProfilePicture: '$result.receiverProfilePicture',
          senderUsername: '$result.senderUsername',
          senderId: '$result.senderId',
          senderAvatarColor: '$result.senderAvatarColor',
          senderProfilePicture: '$result.senderProfilePicture',
          body: '$result.body',
          isRead: '$result.isRead',
          gifUrl: '$result.gifUrl',
          selectedImage: '$result.selectedImage',
          reaction: '$result.reaction',
          createdAt: '$result.createdAt'
        }
      },
      { $sort: { createdAt: 1 } }
    ])
    return messsages
  }

  public async getMessages(senderId: ObjectId, receiverId: ObjectId, sort: Record<string, 1 | -1>): Promise<IMessageData[]> {
    const query = {
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }
    const messages: IMessageData[] = await MessageModel.aggregate([{ $match: query }, { $sort: sort }])
    return messages
  }

  public async markMessageAsDeleted(messageId: string, type: string): Promise<void> {
    if (type === 'deleteForMe') {
      await MessageModel.updateOne({ _id: messageId }, { $set: { deleteForMe: true } }).exec()
    } else {
      await MessageModel.updateOne({ _id: messageId }, { $set: { deleteForMe: true, deleteForEveryone: true } }).exec()
    }
  }

  public async markMessagesAsRead(senderId: ObjectId, receiverId: ObjectId): Promise<void> {
    const query = {
      $or: [
        { senderId, receiverId, isRead: false },
        { senderId: receiverId, receiverId: senderId, isRead: false }
      ]
    }
    await MessageModel.updateMany(query, { $set: { isRead: true } }).exec()
  }
}

export const chatService: ChatService = new ChatService()