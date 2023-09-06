import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import { ObjectId } from 'mongodb'

import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { addReactionSchema } from '../schemes/reactions.scheme'
import { IReactionDocument } from '../interfaces/reactions.interface'
import { ReactionsCache } from '@shared/services/redis/reactions.cache'

const reactionCache: ReactionsCache = new ReactionsCache()

export class AddReactions {
  @joiValidation(addReactionSchema)
  public async add(req: Request, resp: Response): Promise<void> {
    const { userTo, postId, type, previousReaction, postReactions, profilePicture } = req.body
    const reactionObject: IReactionDocument = {
      _id: new ObjectId(),
      postId,
      type,
      avataColor: req.currentUser?.avatarColor,
      username: req.currentUser?.username,
      profilePicture
    } as IReactionDocument

    await reactionCache.savePostReactionsToCache(postId, reactionObject, postReactions, type, previousReaction)

    resp.status(HTTP_STATUS.OK).json({ message: '已成功添加表情' })
  }
}

