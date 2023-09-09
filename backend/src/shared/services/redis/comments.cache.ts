import Logger from 'bunyan'

import { BaseCache } from './base.cache'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { Helpers } from '@/shared/global/helpers/helper'
import { ICommentDocument } from '@feature/comments/interfaces/comments.interface'

const logger: Logger = config.createLogger('commentsCache')

export class CommentsCache extends BaseCache {
  constructor() {
    super('commentsCache')
  }

  public async savePostCommentsToCache(postId: string, comments: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      await this.client.LPUSH(`comments:${postId}`, comments)

      //更新post中的commentsCount
      const commentsCount = await this.client.HMGET(`posts:${postId}`, 'commentsCount')
      let count = Helpers.parseJSON(commentsCount[0])
      const dataToSave: string[] = [`commentsCount`, `${count++}`]
      await this.client.HSET(`posts:${postId}`, dataToSave)
    } catch (error) {
      logger.error(error)
      throw new ServerError('往redis中存入评论内容时失败,请重试')
    }
  }

  public async getCommentsFromCache(postId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const commentsInCache: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1)
      const list: ICommentDocument[] = []
      for (const comment of commentsInCache) {
        list.push(Helpers.parseJSON(comment))
      }
      return list
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中取出评论内容时失败,请重试')
    }
  }
}