import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

import { MessageCache } from '@/shared/services/redis/message.cache'
import { IMessageData } from '../interfaces/chat.interface'
import { socketIOChatObject } from '../../../shared/sockets/chat'
import { chatQueue } from '@/shared/services/queues/chat.queue'

const messageCache: MessageCache = new MessageCache()

export class MsgReaction {
  public async updateReactions(req: Request, resp: Response): Promise<void> {
    const { conversationId, messageId, reaction, type } = req.body

    const updatedMessage: IMessageData = await messageCache.updateMessageReactions(
      `${conversationId}`,
      `${messageId}`,
      `${reaction}`,
      `${req.currentUser!.username}`,
      type
    )

    socketIOChatObject.emit('message reaction', updatedMessage)

    chatQueue.addChatJob('updateMessageReaction', {
      messageId: new mongoose.Types.ObjectId(messageId),
      senderName: req.currentUser!.username,
      reaction,
      type
    })

    resp.status(HTTP_STATUS.OK).json({ message: '已成功在message中更新reaction' })
  }
}