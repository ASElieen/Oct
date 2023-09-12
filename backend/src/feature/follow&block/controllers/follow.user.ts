import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

import { FollowAndBlockCache } from '@/shared/services/redis/follow&block.cache'
import { UserCache } from '@/shared/services/redis/user.cache'
import { IUserDocument } from '@feature/user/interfaces/user.interface'
import { IFollowerData } from '../interfaces/follow.block.interface'

const followAndBlockCache: FollowAndBlockCache = new FollowAndBlockCache()
const userCache: UserCache = new UserCache()

export class AddFollower {
  public async followSomebody(req: Request, resp: Response): Promise<void> {
    const { followerId } = req.params

    const followersCount: Promise<void> = followAndBlockCache.updateFollowerCountInCache(`${followerId}`, 'followersCount', 1)
    const followingCount: Promise<void> = followAndBlockCache.updateFollowerCountInCache(
      `${req.currentUser!.userId}`,
      '	followingCount',
      1
    )

    await Promise.all([followersCount, followingCount])

    const followerInCache: Promise<IUserDocument> = userCache.getUserFromCache(followerId) as Promise<IUserDocument>
    const followingInCache: Promise<IUserDocument> = userCache.getUserFromCache(
      `${req.currentUser!.userId}`
    ) as Promise<IUserDocument>

    const cacheResp = await Promise.all([followerInCache, followingInCache])

    const followerObjectId = new ObjectId()
    const addFollowingData: IFollowerData = AddFollower.prototype.userData(cacheResp[0])

    //send data to client with socketIO
    //....

    //点击之后将其他人加入到当前用户的关注列表中
    const addFollowerToCache = followAndBlockCache.saveFollowerToCache(`following:${req.currentUser!.userId}`, `${followerId}`)
    //在其他人的followers中添加当前用户
    const addFollowingToCache = followAndBlockCache.saveFollowerToCache(`followers:${followerId}`, `${req.currentUser!.userId}`)

    await Promise.all([addFollowerToCache, addFollowingToCache])

    //queue
    //...

    resp.status(HTTP_STATUS.OK).json({ message: `关注${followerId}成功` })
  }

  private userData(user: IUserDocument): IFollowerData {
    return {
      _id: new mongoose.Types.ObjectId(user._id),
      username: user.username!,
      avatarColor: user.avatarColor!,
      postCount: user.postsCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      profilePicture: user.profilePicture,
      uId: user.uId!,
      userProfile: user
    }
  }
}