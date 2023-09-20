import Logger from 'bunyan'
import { findIndex, find } from 'lodash'

import { BaseCache } from './base.cache'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { IMessageData } from '@/feature/chat/interfaces/chat.interface'
import { IChatUsers, IChatList, IGetMessageFromCache } from '@feature/chat/interfaces/chat.interface'
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

  public async getUserConversationList(key: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const userChatList: string[] = await this.client.LRANGE(`chatList:${key}`, 0, -1)

      const conversationChatList: IMessageData[] = []
      for (const item of userChatList) {
        const chatItem: IChatList = Helpers.parseJSON(item) as IChatList
        const lastMessage: string = (await this.client.LINDEX(`messages:${chatItem.conversationId}`, -1)) as string
        conversationChatList.push(Helpers.parseJSON(lastMessage))
      }

      return conversationChatList
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中获取conversationList失败,请重试')
    }
  }

  public async getChatMessageFromCache(senderId: string, receiverId: string): Promise<IMessageData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1)
      const receiver: string = find(userChatList, (listItem: string) => listItem.includes(receiverId)) as string
      const parsedReceiver: IChatList = Helpers.parseJSON(receiver) as IChatList

      if (parsedReceiver) {
        const userMessages: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, -1)
        const chatMessages: IMessageData[] = []
        for (const item of userMessages) {
          const chatItem = Helpers.parseJSON(item) as IMessageData
          chatMessages.push(chatItem)
        }
        return chatMessages
      } else {
        return []
      }
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中获取ChatMessage失败,请重试')
    }
  }

  public async markMessageAsDeleted(
    senderId: string,
    receiverId: string,
    messageId: string,
    type: string
  ): Promise<IMessageData> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      const { index, message, receiver } = await this.getMessage(senderId, receiverId, messageId)
      const chatItem = Helpers.parseJSON(message) as IMessageData
      if (type === 'deleteForMe') {
        chatItem.deleteForMe = true
      } else {
        chatItem.deleteForMe = true
        chatItem.deleteForEveryone = true
      }
      await this.client.LSET(`messages:${receiver.conversationId}`, index, JSON.stringify(chatItem))

      const lastMessage: string = (await this.client.LINDEX(`messages:${receiver.conversationId}`, index)) as string
      return Helpers.parseJSON(lastMessage) as IMessageData
    } catch (error) {
      logger.error(error)
      throw new ServerError('标记消息失败，请重试')
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

  private async getMessage(senderId: string, receiverId: string, messageId: string): Promise<IGetMessageFromCache> {
    const userChatList: string[] = await this.client.LRANGE(`chatList:${senderId}`, 0, -1)
    const receiver: string = find(userChatList, (listItem: string) => listItem.includes(receiverId)) as string
    const parsedReceiver: IChatList = Helpers.parseJSON(receiver) as IChatList
    const messages: string[] = await this.client.LRANGE(`messages:${parsedReceiver.conversationId}`, 0, -1)
    const message: string = find(messages, (listItem: string) => listItem.includes(messageId)) as string
    const index: number = findIndex(messages, (listItem: string) => listItem.includes(messageId))

    return { index, message, receiver: parsedReceiver }
  }
}