import Logger from 'bunyan'
import mongoose from 'mongoose'

import { BaseCache } from './base.cache'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'

const logger: Logger = config.createLogger('follow&blockCache')

export class FollowAndBlockCache extends BaseCache {
  constructor() {
    super('follow&blockCache')
  }

  public async saveFollowerToCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      await this.client.LPUSH(key, value)
    } catch (error) {
      logger.error(error)
      throw new ServerError('存储follower至redis的过程中发生错误,请重试')
    }
  }

  public async removeFollowerFromCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      await this.client.LREM(key, 1, value)
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中移除follower的过程中发生错误,请重试')
    }
  }

  public async updateFollowerCountInCache(userId: string, prop: string, value: number): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      //用于为哈希表中的字段值加上火减去指定数值
      await this.client.HINCRBY(`users:${userId}`, prop, value)
    } catch (error) {
      logger.error(error)
      throw new ServerError('在redis中更新follower的过程中发生错误,请重试')
    }
  }
}