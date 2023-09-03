import { BaseCache } from './base.cache'
import Logger from 'bunyan'

import { ISavePostToCache } from '@/feature/posts/interfaces/post.interface'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'

const logger: Logger = config.createLogger('postCache')

export class PostCache extends BaseCache {
  constructor() {
    super('postCache')
  }

  public async savePostToCache(data: ISavePostToCache): Promise<void> {
    const { key, currentUserId, uId, createdPost } = data
    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount,
      imgVersion,
      imgId,
      reactions,
      createdAt
    } = createdPost

    const firstList: string[] = [
      '_id',
      `${_id}`,
      'userId',
      `${userId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'profilePicture',
      `${profilePicture}`,
      'post',
      `${post}`,
      'bgColor',
      `${bgColor}`,
      'feelings',
      `${feelings}`,
      'privacy',
      `${privacy}`,
      'gifUrl',
      `${gifUrl}`
    ]

    const secondList: string[] = [
      'commentsCount',
      `${commentsCount}`,
      'reactions',
      `${JSON.stringify(reactions)}`,
      'imgVersion',
      `${imgVersion}`,
      'imgId',
      `${imgId}`,
      'createdAt',
      `${createdAt}`
    ]

    const dataToSave: string[] = [...firstList, ...secondList]

    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      const postsCount = await this.client.HMGET(`users:${currentUserId}`, 'postsCount')
      //multi标记一个队列 随后按顺序执行
      const multi = this.client.multi()
      multi.ZADD('post', { score: parseInt(uId), value: `${key}` })
      multi.HSET(`posts:${key}`, dataToSave)
      //解析为十进制 number类型
      const count = parseInt(postsCount[0], 10) + 1
      multi.HSET(`users:${currentUserId}`, ['postsCount', count])
      multi.exec()
    } catch (error) {
      logger.error(error)
      throw new ServerError('用户post数据存入redis失败,请重试')
    }
  }
}