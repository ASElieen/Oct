import Logger from 'bunyan'
import mongoose from 'mongoose'

import { BaseCache } from './base.cache'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { IFollowerData } from '@/feature/follow&block/interfaces/follow.block.interface'
import { IUserDocument } from '@feature/user/interfaces/user.interface'
import { UserCache } from './user.cache'

const logger: Logger = config.createLogger('follow&blockCache')
const userCache: UserCache = new UserCache()

export class FollowAndBlockCache extends BaseCache {
  constructor() {
    super('follow&blockCache')
  }

  public async saveFollowerToCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      //redis中 点关注的用户放进following 被关注的放入followers
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

  public async getFollowersFromCache(key: string): Promise<IFollowerData[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      const allFollowers = await this.client.LRANGE(key, 0, -1)

      const list: IFollowerData[] = []
      for (const item of allFollowers) {
        const user: IUserDocument = (await userCache.getUserFromCache(item)) as IUserDocument
        const data: IFollowerData = {
          _id: new mongoose.Types.ObjectId(user._id),
          username: user.username!,
          avatarColor: user.avatarColor!,
          postCount: user.postsCount,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          profilePicture: user.profilePicture,
          uId: user.uId!,
          userProfile: user
        }
        list.push(data)
      }
      return list
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中取出所有follower的过程中发生错误,请重试')
    }
  }
}