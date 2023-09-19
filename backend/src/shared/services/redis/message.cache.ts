import Logger from 'bunyan'
import { findIndex } from 'lodash'

import { BaseCache } from './base.cache'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { IMessageData } from '@/feature/chat/interfaces/chat.interface'
import { IChatUsers } from '@feature/chat/interfaces/chat.interface'
import { Helpers } from '@/shared/global/helpers/helper'

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

  public async addChatUserToCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const users: IChatUsers[] = await this.getChatUserList()
      const userIndex: number = findIndex(users, (listItem: IChatUsers) => JSON.stringify(listItem) === JSON.stringify(value))

      let chatUsers: IChatUsers[] = []

      if (userIndex === -1) {
        await this.client.RPUSH('chatUsers', JSON.stringify(value))
        chatUsers = await this.getChatUserList()
      } else {
        chatUsers = users
      }

      return chatUsers
    } catch (error) {
      logger.error(error)
      throw new ServerError('添加chatUser至redis失败,请重试')
    }
  }

  public async removeChatUsersFromCache(value: IChatUsers): Promise<IChatUsers[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      const users: IChatUsers[] = await this.getChatUserList()
      const userIndex: number = findIndex(
        users,
        (listItem: IChatUsers): boolean => JSON.stringify(listItem) === JSON.stringify(value)
      )

      let chatUsers: IChatUsers[] = []

      if (userIndex > -1) {
        await this.client.LREM('chatUsers', userIndex, JSON.stringify(value))
        chatUsers = await this.getChatUserList()
      } else {
        chatUsers = users
      }
      return chatUsers
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中移出chatuser时发生错误,请重试')
    }
  }

  private async getChatUserList(): Promise<IChatUsers[]> {
    const chatUserList: IChatUsers[] = []
    const chatUsers = await this.client.LRANGE(`chatUsers`, 0, -1)
    for (const item of chatUsers) {
      const chatUser: IChatUsers = Helpers.parseJSON(item) as IChatUsers
      chatUserList.push(chatUser)
    }
    return chatUserList
  }
}