import Logger from 'bunyan'
import { findIndex } from 'lodash'

import { BaseCache } from './base.cache'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { IMessageData } from '@/feature/chat/interfaces/chat.interface'

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

  public async addChatMessageToCache(conversationId: string, value: IMessageData): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      await this.client.RPUSH(`messages:${conversationId}`, JSON.stringify(value))
    } catch (error) {
      logger.error(error)
      throw new ServerError('添加chat message至redis失败,请重试')
    }
  }
}