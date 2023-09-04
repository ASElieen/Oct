import { BaseCache } from './base.cache'
import Logger from 'bunyan'
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands'

import { ISavePostToCache } from '@/feature/posts/interfaces/post.interface'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { IPostDocument } from '@feature/posts/interfaces/post.interface'
import { IReactions } from '@/feature/posts/interfaces/post.interface'
import { Helpers } from '../../global/helpers/helper'

const logger: Logger = config.createLogger('postCache')

export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[]

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

  //redis中取出post
  public async getPostFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      //ZRANGE从有序集合里取出key，用这个key去hash里拿表
      const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true })
      const multi: ReturnType<typeof this.client.multi> = this.client.multi()
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`)
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType
      const postReplies: IPostDocument[] = []
      for (const posts of replies as IPostDocument[]) {
        posts.commentsCount = Helpers.parseJSON(`${posts.commentsCount}`)
        posts.reactions = Helpers.parseJSON(`${posts.reactions}`)
        posts.createdAt = new Date(Helpers.parseJSON(`${posts.reactions}`))
        postReplies.push(posts)
      }

      return postReplies
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中取出用户post数据失败,请重试')
    }
  }

  public async getTotalPostsInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      //返回post有序集合的基数
      const count: number = await this.client.ZCARD('post')
      return count
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中取出post次数失败,请重试')
    }
  }

  //redis中取出附带图片的post
  public async getPostsWithImagesFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true })
      const multi: ReturnType<typeof this.client.multi> = this.client.multi()
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`)
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType
      const postWithImages: IPostDocument[] = []
      for (const post of replies as IPostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helpers.parseJSON(`${post.commentsCount}`) as number
          post.reactions = Helpers.parseJSON(`${post.reactions}`) as IReactions
          post.createdAt = new Date(Helpers.parseJSON(`${post.createdAt}`)) as Date
          postWithImages.push(post)
        }
      }
      return postWithImages
    } catch (error) {
      logger.error(error)
      throw new ServerError('取出post(image)失败 请重试')
    }
  }

  //通过SCORE存的uid获取同一个用户的所有post
  public async getUserPostFromCache(key: string, uId: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      const reply: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' })
      const multi: ReturnType<typeof this.client.multi> = this.client.multi()
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`)
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType
      const postReplies: IPostDocument[] = []
      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJSON(`${post.commentsCount}`) as number
        post.reactions = Helpers.parseJSON(`${post.reactions}`) as IReactions
        post.createdAt = new Date(Helpers.parseJSON(`${post.createdAt}`)) as Date
        postReplies.push(post)
      }
      return postReplies
    } catch (error) {
      logger.error(error)
      throw new ServerError('获取单个用户post失败,请重试')
    }
  }

  //获取单个用户的post总数
  public async getTotalUserPostsInCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      //返回post有序集合的基数
      const count: number = await this.client.ZCOUNT('post', uId, uId)
      return count
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中取出单个用户post次数失败,请重试')
    }
  }
}