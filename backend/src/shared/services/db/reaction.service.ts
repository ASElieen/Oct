import { IReactionJob } from '@feature/reactions/interfaces/reactions.interface'
import { UserCache } from '../redis/user.cache'
import { ReactionModel } from '@/feature/reactions/models/reactions.model'
import { PostModel } from '@/feature/posts/models/post.schema'

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
}

export const reactionService: ReactionService = new ReactionService()