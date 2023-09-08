import { Request, Response } from 'express'
import mongoose from 'mongoose'
import HTTP_STATUS from 'http-status-codes'

import { ReactionsCache } from '@/shared/services/redis/reactions.cache'
import { IReactionDocument } from '@feature/reactions/interfaces/reactions.interface'
import { reactionService } from '@/shared/services/db/reaction.service'

const reactionsCache: ReactionsCache = new ReactionsCache()

export class GetReaction {
  public async getReaction(req: Request, resp: Response): Promise<void> {
    const { postId } = req.params
    const reactionsInCache: [IReactionDocument[], number] = await reactionsCache.getReactionFromCache(postId)

    const reactionData = reactionsInCache[0].length
      ? reactionsInCache
      : await reactionService.getPostReactions({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 })

    resp.status(HTTP_STATUS.OK).json({ message: 'Post reactions', reactions: reactionData[0], count: reactionData[1] })
  }

  public async getSingleReactionByUsername(req: Request, resp: Response): Promise<void> {
    const { postId, username } = req.params
    const reactionsInCache: [IReactionDocument, number] | [] = await reactionsCache.getSingleReactionByUsernameFromCache(
      postId,
      username
    )

    const reactionData = reactionsInCache.length
      ? reactionsInCache
      : await reactionService.getSinglePostReactionByUsername(postId, username)

    resp.status(HTTP_STATUS.OK).json({
      message: 'single reaction by username',
      reactionData: reactionData.length ? reactionData[0] : {},
      count: reactionData.length ? reactionData[1] : 0
    })
  }

  public async getReactionsByUsername(req: Request, resp: Response): Promise<void> {
    const { username } = req.params
    const reactions: IReactionDocument[] = await reactionService.getReactionsByUsername(username)
    resp.status(HTTP_STATUS.OK).json({ message: 'get reactions by username', reactions })
  }
}
