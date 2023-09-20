import { BaseCache } from './base.cache'
import { IUserDocument } from '@feature/user/interfaces/user.interface'
import Logger from 'bunyan'
import { config } from '@/config'
import { ServerError } from '@shared/global/helpers/errorHandler'
import { Helpers } from '../../global/helpers/helper'
import { ISocialLinks } from '@feature/user/interfaces/user.interface'
import { INotificationSettings } from '@feature/user/interfaces/user.interface'
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands'

const log: Logger = config.createLogger('userCache')
type UserItem = string | ISocialLinks | INotificationSettings
type UserCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IUserDocument | IUserDocument[]

export class UserCache extends BaseCache {
  constructor() {
    super('userCache')
  }

  public async saveUserToCache(key: string, userId: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date()
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser

    const firstList: string[] = [
      '_id',
      `${_id}`,
      '_uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`
    ]

    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      JSON.stringify(profilePicture),
      'followersCount',
      JSON.stringify(followersCount),
      'followingCount',
      JSON.stringify(followingCount),
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social)
    ]

    const thirdList = [
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'bgImageId',
      `${bgImageId}`,
      'bgImageVersion',
      `${bgImageVersion}`
    ]

    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList]

    try {
      if (!this.client.isOpen) await this.client.connect()
      //key score1 value1
      await this.client.ZADD('user', { score: parseInt(userId, 10), value: `${key}` })
      await this.client.HSET(`users:${key}`, dataToSave)
    } catch (error) {
      log.error(error)
      throw new ServerError('存入redis时发生错误,清排查后重试')
    }
  }

  public async getUserFromCache(key: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) await this.client.connect()
      const resp = (await this.client.HGETALL(`users:${key}`)) as unknown as IUserDocument
      resp.createdAt = new Date(Helpers.parseJSON(`${resp.createdAt}`)!)
      resp.postsCount = Helpers.parseJSON(`${resp.postsCount}`)
      resp.blocked = Helpers.parseJSON(`${resp.blocked}`)
      resp.blockedBy = Helpers.parseJSON(`${resp.blockedBy}`)
      resp.notifications = Helpers.parseJSON(`${resp.notifications}`)
      resp.social = Helpers.parseJSON(`${resp.social}`)
      resp.followersCount = Helpers.parseJSON(`${resp.followersCount}`)
      resp.followingCount = Helpers.parseJSON(`${resp.followingCount}`)
      resp.bgImageId = Helpers.parseJSON(`${resp.bgImageId}`)
      resp.bgImageVersion = Helpers.parseJSON(`${resp.bgImageVersion}`)
      resp.profilePicture = Helpers.parseJSON(`${resp.profilePicture}`)
      return resp
    } catch (error) {
      log.error(error)
      throw new ServerError('从redis取出user时发生错误,请排查后重试')
    }
  }

  public async getUsersFromCacheWithPagnation(start: number, end: number, excludedUserKey: string): Promise<IUserDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const response: string[] = await this.client.ZRANGE('user', start, end, { REV: true })
      const multi: ReturnType<typeof this.client.multi> = this.client.multi()
      for (const key of response) {
        //跳过自己
        if (key !== excludedUserKey) {
          multi.HGETALL(`users:${key}`)
        }
      }

      const replies: UserCacheMultiType = (await multi.exec()) as UserCacheMultiType
      const userReplies: IUserDocument[] = []

      for (const reply of replies as IUserDocument[]) {
        reply.createdAt = new Date(Helpers.parseJSON(`${reply.createdAt}`))
        reply.postsCount = Helpers.parseJSON(`${reply.postsCount}`)
        reply.blocked = Helpers.parseJSON(`${reply.blocked}`)
        reply.blockedBy = Helpers.parseJSON(`${reply.blockedBy}`)
        reply.notifications = Helpers.parseJSON(`${reply.notifications}`)
        reply.social = Helpers.parseJSON(`${reply.social}`)
        reply.followersCount = Helpers.parseJSON(`${reply.followersCount}`)
        reply.followingCount = Helpers.parseJSON(`${reply.followingCount}`)
        reply.bgImageId = Helpers.parseJSON(`${reply.bgImageId}`)
        reply.bgImageVersion = Helpers.parseJSON(`${reply.bgImageVersion}`)
        reply.profilePicture = Helpers.parseJSON(`${reply.profilePicture}`)
        reply.work = Helpers.parseJSON(`${reply.work}`)
        reply.school = Helpers.parseJSON(`${reply.school}`)
        reply.location = Helpers.parseJSON(`${reply.location}`)
        reply.quote = Helpers.parseJSON(`${reply.quote}`)

        userReplies.push(reply)
      }
      return userReplies
    } catch (error) {
      log.error(error)
      throw new ServerError('从redis取出users时发生错误,请排查后重试')
    }
  }

  public async updateSingleUserInCache(userId: string, prop: string, value: UserItem): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      await this.client.HSET(`users:${userId}`, `${prop}`, JSON.stringify(value))
      const resp: IUserDocument = (await this.getUserFromCache(userId)) as IUserDocument
      return resp
    } catch (error) {
      log.error(error)
      throw new ServerError('更新redis中的user数据时发生错误,请排查后重试')
    }
  }
}