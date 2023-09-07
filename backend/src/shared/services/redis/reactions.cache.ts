import { BaseCache } from './base.cache'
import Logger from 'bunyan'
import _, { find } from 'lodash'

import { config } from '@/config'
import { ServerError } from '@/shared/global/helpers/errorHandler'
import { Helpers } from '@/shared/global/helpers/helper'
import { IReactionDocument } from '@feature/reactions/interfaces/reactions.interface'
import { IReactions } from '@feature/reactions/interfaces/reactions.interface'

const logger: Logger = config.createLogger('reactionsCache')

export class ReactionsCache extends BaseCache {
  constructor() {
    super('reactionsCache')
  }

  /**
   *
   * @param key _id
   * @param reaction 其他用户对该用户post点表情的数据结构
   * @param postReaction 表情数 [happy:1 ....]
   * @param type reaction type (happy,love....)
   * @param previousReactions post中已经存在的reaction type
   */
  public async savePostReactionsToCache(
    key: string,
    reaction: IReactionDocument,
    postReaction: IReactions,
    type: string,
    previousReactions: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) await this.client.connect()

      if (previousReactions) {
        this.removePostReactionsFromCache(key, reaction.username, postReaction)
      }

      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction))
        const dataToSave: string[] = ['reactions', JSON.stringify(postReaction)]
        await this.client.HSET(`posts:${key}`, dataToSave)
      }
    } catch (error) {
      logger.error(error)
      throw new ServerError('存储表情至redis时发生错误,请重试')
    }
  }

  public async removePostReactionsFromCache(key: string, username: string, postReaction: IReactions): Promise<void> {
    try {
      if (!this.client.isOpen) await this.client.connect()

      const resp: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1)
      const multi = this.client.multi()
      const userPreviousReactions = this.getPreviousReactions(resp, username)
      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReactions))
      await multi.exec()

      const dataToSave = [`reactions`, JSON.stringify(postReaction)]
      await this.client.HSET(`posts:${key}`, dataToSave)
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis移除reaction时发生错误,请重试')
    }
  }

  public async getReactionFromCache(postId: string): Promise<[IReactionDocument[], number]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const reactionCount = await this.client.LLEN(`reactions:${postId}`)
      const reactionData = await this.client.LRANGE(`reactions:${postId}`, 0, -1)
      const list: IReactionDocument[] = []

      for (const item of reactionData) {
        list.push(Helpers.parseJSON(item))
      }

      return reactionData.length ? [list, reactionCount] : [[], 0]
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis取出reaction时发生错误,请重试')
    }
  }

  public async getSingleReactionByUsernameFromCache(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect()
      }

      const reactionData = await this.client.LRANGE(`reactions:${postId}`, 0, -1)
      const list: IReactionDocument[] = []
      for (const item of reactionData) {
        list.push(Helpers.parseJSON(item))
      }

      const res: IReactionDocument = find(list, (listItem: IReactionDocument) => {
        return listItem.postId === postId && listItem?.username === username
      }) as IReactionDocument

      return res ? [res, 1] : []
    } catch (error) {
      logger.error(error)
      throw new ServerError('从redis中根据用户名取出单个reaction时发生错误,请重试')
    }
  }

  private getPreviousReactions(resp: string[], username: string): IReactionDocument | undefined {
    const list: IReactionDocument[] = []
    for (const item of resp) {
      list.push(Helpers.parseJSON(item) as IReactionDocument)
    }
    return find(list, (listItem: IReactionDocument) => {
      return listItem.username === username
    })
  }
}