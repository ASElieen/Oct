import { BaseCache } from './base.cache'
import { IUserDocument } from '@feature/user/interfaces/user.interface'
import Logger from 'bunyan'
import { config } from '@/config'
import { ServerError } from '@shared/global/helpers/errorHandler'

const log: Logger = config.createLogger('userCache')

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
}