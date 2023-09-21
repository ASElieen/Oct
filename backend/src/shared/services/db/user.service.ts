import { IUserDocument } from '@/feature/user/interfaces/user.interface'
import { UserModel } from '@/feature/user/models/user.schemal'
import mongoose from 'mongoose'
import { indexOf } from 'lodash'
import { followerService } from './follower.service'

class UserService {
  public async addUserData(data: IUserDocument): Promise<void> {
    await UserModel.create(data)
  }

  public async getUserByMongoId(_id: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      //过滤
      { $match: { _id: new mongoose.Types.ObjectId(_id) } },
      //from 要去查询的表 local 根据什么字段 foreign 要去匹配什么字段 as 放入本表的字段
      //去Auth中找和User authId相同的_id 并返回authId
      { $lookup: { from: 'Auth', localField: '_id', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      //增删或重命名字段
      { $project: this.aggregateProject() }
    ])
    return users[0]
  }

  public async getAllUsersWithPagnation(userId: string, skip: number, limit: number): Promise<IUserDocument[]> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'Auth', localField: '_id', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ])
    return users
  }

  public async getTotalUsersInDB(): Promise<number> {
    const totalCount: number = await UserModel.find({}).countDocuments()
    return totalCount
  }

  public async getRandomUsers(userId: string): Promise<IUserDocument[]> {
    const randomUsers: IUserDocument[] = []
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $lookup: { from: 'Auth', localField: '_id', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $sample: { size: 10 } },
      {
        $addFields: {
          username: '$authId.username',
          email: '$authId.email',
          avatarColor: '$authId.avatarColor',
          uId: '$authId.uId',
          createdAt: '$authId.createdAt'
        }
      },
      {
        $project: {
          authId: 0,
          __v: 0
        }
      }
    ])
    const followers: string[] = await followerService.getFollowingIDs(`${userId}`)
    for (const user of users) {
      const followerIndex = indexOf(followers, user._id.toString())
      if (followerIndex < 0) {
        randomUsers.push(user)
      }
    }
    return randomUsers
  }

  private aggregateProject() {
    return {
      _id: 1,
      username: '$authId.username',
      uId: '$authId.uId',
      email: '$authId.email',
      avatarColor: '$authId.avatarColor',
      createdAt: '$authId.createdAt',
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      profilePicture: 1
    }
  }
}

export const userService: UserService = new UserService()