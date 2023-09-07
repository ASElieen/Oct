import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { ReactionsCache } from '@/shared/services/redis/reactions.cache'
import { reactionQueue } from '@/shared/services/queues/reaction.queue'
import { IReactionJob } from '@feature/reactions/interfaces/reactions.interface'

const reactionCache: ReactionsCache = new ReactionsCache()

export class RemoveReactions {
  public async remove(req: Request, resp: Response) {
    const { postId, previousReaction, postReaction } = req.params
    await reactionCache.removePostReactionsFromCache(postId, `${req.currentUser!.username}`, JSON.parse(postReaction))

    const databaseReactionData: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      previousReaction
    }

    reactionQueue.addReactionJob('removeReactionFromDB', databaseReactionData)
    resp.status(HTTP_STATUS.OK).json({ message: '已成功移除post中的表情' })
  }
}
