import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

import { FollowerModel } from '@/feature/follow&block/models/follower.schema'
import { UserModel } from '@/feature/user/models/user.schemal'

class FollowerService {
  public async addFollowerToDB(
    userId: string,
    followingId: string,
    username: string,
    followerDocumentId: ObjectId
  ): Promise<void> {
    const followingObjectId = new mongoose.Types.ObjectId(followingId)
    const followerObjectId = new mongoose.Types.ObjectId(userId)

    await FollowerModel.create({
      _id: followerDocumentId,
      followingId: followingObjectId,
      followerId: followerObjectId
    })

    //批量操作
    const users = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: { $inc: { followingCount: 1 } }
        }
      },
      {
        updateOne: {
          filter: { _id: followingId },
          update: { $inc: { followersCount: 1 } }
        }
      }
    ])

    await Promise.all([users, UserModel.findOne({ _id: followingId })])
  }

  public async removeFollowerToDB(followingId: string, followerId: string): Promise<void> {
    const followingObjectId = new mongoose.Types.ObjectId(followingId)
    const followerObjectId = new mongoose.Types.ObjectId(followerId)

    const unfollow = FollowerModel.deleteOne({
      followingId: followingObjectId,
      followerId: followerObjectId
    })

    //批量操作
    const users = UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: followerId },
          update: { $inc: { followingCount: -1 } }
        }
      },
      {
        updateOne: {
          filter: { _id: followingId },
          update: { $inc: { followersCount: -1 } }
        }
      }
    ])

    await Promise.all([unfollow, users])
  }
}

export const followerService: FollowerService = new FollowerService()