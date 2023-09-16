import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

import { FollowerModel } from '@/feature/follow&block/models/follower.schema'
import { UserModel } from '@/feature/user/models/user.schemal'
import { IFollowerData } from '@/feature/follow&block/interfaces/follow.block.interface'

class FollowerService {
  public async addFollowerToDB(
    userId: string,
    followingId: string,
    username: string,
    followerDocumentId: ObjectId
  ): Promise<void> {
    //用户A(当前用户) 作为follower following 了用户B
    //A放入 follower  B放入 following
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

  public async removeFollowerFromDB(followingId: string, followerId: string): Promise<void> {
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

  //拿到某一用户(A)的所有following 通过查所有followers为A的doc对应的following即可
  public async getFollowingData(userObjectId: ObjectId): Promise<IFollowerData[]> {
    const following = await FollowerModel.aggregate([
      { $match: { followerId: userObjectId } },
      //from 要去查询的表 local 根据什么字段 foreign 要去匹配什么字段 as 放入本表的字段
      { $lookup: { from: 'User', localField: 'followerId', foreignField: '_id', as: 'FollowingUserData' } },
      //拆开数组
      { $unwind: '$FollowingUserData' },
      { $lookup: { from: 'Auth', localField: 'FollowingUserData.authId', foreignField: '_id', as: 'FollowingAuthData' } },
      { $unwind: '$AuthData' },
      {
        $addFields: {
          _id: '$FollowingUserData._id',
          username: '$AuthData.username',
          avatarColor: '$AuthData.avatarColor',
          uId: '$AuthData.uId',
          postCount: '$FollowingUserData.postsCount',
          followersCount: '$FollowingUserData.followersCount',
          followingCount: '$FollowingUserData.followingCount',
          profilePicture: '$FollowingUserData.profilePicture',
          userProfile: '$FollowingUserData'
        }
      },
      {
        $project: {
          AuthData: 0,
          followerId: 0,
          UserData: 0,
          createdAt: 0,
          __v: 0
        }
      }
    ])
    return following
  }

  //拿到某一用户(A)的followers 通过查所有following为A的doc，其他用户作为follower去following了A，拿所有follower
  public async getFollowerDataInDB(userObjectId: ObjectId): Promise<IFollowerData[]> {
    const follower = await FollowerModel.aggregate([
      { $match: { followingId: userObjectId } },
      //from 要去查询的表 local 根据什么字段 foreign 要去匹配什么字段 as 放入本表的字段
      { $lookup: { from: 'User', localField: 'followingId', foreignField: '_id', as: 'FollowerUserData' } },
      //拆开数组
      { $unwind: '$FollowerUserData' },
      { $lookup: { from: 'Auth', localField: 'FollowerUserData.authId', foreignField: '_id', as: 'AuthData' } },
      { $unwind: '$AuthData' },
      {
        $addFields: {
          _id: '$FollowerUserData._id',
          username: '$AuthData.username',
          avatarColor: '$AuthData.avatarColor',
          uId: '$AuthData.uId',
          postCount: '$FollowerUserData.postsCount',
          followersCount: '$FollowerUserData.followersCount',
          followingCount: '$FollowerUserData.followingCount',
          profilePicture: '$FollowerUserData.profilePicture',
          userProfile: '$FollowerUserData'
        }
      },
      {
        $project: {
          AuthData: 0,
          followerId: 0,
          UserData: 0,
          createdAt: 0,
          __v: 0
        }
      }
    ])
    return follower
  }
}

export const followerService: FollowerService = new FollowerService()