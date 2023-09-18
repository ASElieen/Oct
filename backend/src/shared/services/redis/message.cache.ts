import Logger from 'bunyan'

import { BaseCache } from './base.cache'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { findIndex } from 'lodash'

const logger: Logger = config.createLogger('messageCache')

export class MessageCache extends BaseCache {
  constructor() {
    super('messageCache')
  }

  public async addChatListToCache(senderId: string, receiverId: string, conversationId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      const userChatList = await this.client.LRANGE(`chatList:${senderId}`, 0, -1)
      if (userChatList.length === 0) {
        //RPUSH添加到列表的最末尾(right)
        await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }))
      } else {
        const receiverIndex = findIndex(userChatList, (listItem: string): boolean => listItem.includes(receiverId))
        if (receiverIndex < 0) {
          await this.client.RPUSH(`chatList:${senderId}`, JSON.stringify({ receiverId, conversationId }))
        }
      }
    } catch (error) {
      logger.error(error)
      throw new ServerError('添加chatlist至redis失败,请重试')
    }
  }
}