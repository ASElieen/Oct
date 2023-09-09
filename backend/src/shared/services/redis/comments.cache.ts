import Logger from 'bunyan'
import { find } from 'lodash'

import { BaseCache } from './base.cache'
import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { Helpers } from '@/shared/global/helpers/helper'
import { ICommentDocument } from '@feature/comments/interfaces/comments.interface'
import { ICommentNameList } from '@feature/comments/interfaces/comments.interface'

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

  public async getCommentsNameFromCache(postId: string): Promise<ICommentNameList> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      const commentsCount = await this.client.LLEN(`comments:${postId}`)
      const commentsInCache = await this.client.LRANGE(`comments:${postId}`, 0, -1)

      const list: string[] = []
      for (const item of commentsInCache) {
        const comment: ICommentDocument = Helpers.parseJSON(item)
        list.push(comment.username)
      }

      const resp: ICommentNameList = {
        count: commentsCount,
        names: list
      }
      return resp
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中取出评论用户时失败,请重试')
    }
  }

  public async getSingleCommentFromCache(postId: string, commentId: string): Promise<ICommentDocument> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const commentsInCache = await this.client.LRANGE(`comments:${postId}`, 0, -1)
      const list: ICommentDocument[] = []
      for (const comment of commentsInCache) {
        list.push(Helpers.parseJSON(comment))
      }

      const singleComment = find(list, (listItem: ICommentDocument) => {
        return listItem._id === commentId
      }) as ICommentDocument
      return singleComment
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中取出单个评论时失败,请重试')
    }
  }
}