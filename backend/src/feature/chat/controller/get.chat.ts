import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

import { MessageCache } from '@/shared/services/redis/message.cache'
import { chatService } from '@/shared/services/db/chat.service'
import { IMessageData } from '../interfaces/chat.interface'

const messageCache: MessageCache = new MessageCache()

export class GetChat {
  public async conversationList(req: Request, resp: Response): Promise<void> {
    let list: IMessageData[] = []
    const cachedList: IMessageData[] = await messageCache.getUserConversationList(`${req.currentUser!.userId}`)
    if (cachedList.length) {
      list = cachedList
    } else {
      list = await chatService.getUserConversationList(new mongoose.Types.ObjectId(req.currentUser!.userId))
    }

    resp.status(HTTP_STATUS.OK).json({ message: '获取用户conversation list成功', list })
  }
}