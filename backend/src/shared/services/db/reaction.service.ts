import mongoose from 'mongoose'

import { IReactionJob, IReactionDocument, IQueryReaction } from '@feature/reactions/interfaces/reactions.interface'
import { UserCache } from '../redis/user.cache'
import { ReactionModel } from '@/feature/reactions/models/reactions.model'
import { PostModel } from '@/feature/posts/models/post.schema'
import { Helpers } from '@/shared/global/helpers/helper'

const userCache: UserCache = new UserCache()

class ReactionService {
  public async addReactionDataToDB(reaction: IReactionJob): Promise<void> {
    //userFrom =>currentUser
    console.log(reaction)
    const { postId, userTo, userFrom, username, previousReaction, reactionObject } = reaction

    const updateReactions = await Promise.all([
      userCache.getUserFromCache(`${userTo}`),
      //upsert 找到就更新 没有就创建
      ReactionModel.replaceOne({ postId, type: previousReaction, username }, reactionObject, { upsert: true }),
      PostModel.findByIdAndUpdate(
        { _id: postId },
        {
          $inc: {
            [`reactions.${reactionObject?.type}`]: 1,
            [`reactions.${previousReaction}`]: -1
          }
        },
        {
          $new: true
        }
      )
    ])
  }

  public async removeReactionDataFromDB(reactionData: IReactionJob): Promise<void> {
    const { postId, previousReaction, username } = reactionData
    await Promise.all([
      ReactionModel.deleteOne({ postId, type: previousReaction, username }),
      PostModel.updateOne(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1
          }
        },
        {
          $new: true
        }
      )
    ])
  }

  //获取post对应的所有reaction
  //sort createdAt排序
  public async getPostReactions(query: IQueryReaction, sort: Record<string, 1 | -1>): Promise<[IReactionDocument[], number]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([{ $match: query }, { $sort: sort }])
    return [reactions, reactions.length]
  }

  public async getSinglePostReactionByUsername(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), username: Helpers.firstLetterToUppercase(username) } }
    ])
    return reactions.length ? [reactions[0], 1] : []
  }

  public async getReactionsByUsername(username: string): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { username: Helpers.firstLetterToUppercase(username) } }
    ])
    return reactions
  }
}

export const reactionService: ReactionService = new ReactionService()