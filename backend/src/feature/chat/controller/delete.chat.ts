import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

import { MessageCache } from '@/shared/services/redis/message.cache'
import { IMessageData } from '../interfaces/chat.interface'
import { socketIOChatObject } from '@/shared/sockets/chat'
import { chatQueue } from '@/shared/services/queues/chat.queue'

const messageCache: MessageCache = new MessageCache()

export class DeleteChat {
  public async markMessageAsDeleted(req: Request, resp: Response): Promise<void> {
    const { senderId, receiverId, messageId, type } = req.params
    const updatedMessage: IMessageData = await messageCache.markMessageAsDeleted(
      `${senderId}`,
      `${receiverId}`,
      `${messageId}`,
      type
    )

    socketIOChatObject.emit('message read', updatedMessage)
    socketIOChatObject.emit('chat list', updatedMessage)

    chatQueue.addChatJob('markMessageAsDeleted', {
      messageId: new mongoose.Types.ObjectId(messageId),
      type
    })
    resp.status(HTTP_STATUS.OK).json({ message: '已将消息标记为deleted' })
  }
}