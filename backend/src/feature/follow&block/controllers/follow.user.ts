import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

import { FollowAndBlockCache } from '@/shared/services/redis/follow&block.cache'
import { UserCache } from '@/shared/services/redis/user.cache'
import { IUserDocument } from '@feature/user/interfaces/user.interface'
import { IFollowerData } from '../interfaces/follow.block.interface'
import { socketIOFollowerObject } from '@/shared/sockets/follower'
import { followerQueue } from '@/shared/services/queues/follower.queue'

const followAndBlockCache: FollowAndBlockCache = new FollowAndBlockCache()
const userCache: UserCache = new UserCache()

export class AddFollower {
  public async followSomebody(req: Request, resp: Response): Promise<void> {
    const { followerId } = req.params

    const followersCount: Promise<void> = followAndBlockCache.updateFollowerCountInCache(`${followerId}`, 'followersCount', 1)
    const followingCount: Promise<void> = followAndBlockCache.updateFollowerCountInCache(
      `${req.currentUser!.userId}`,
      'followingCount',
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
    socketIOFollowerObject.emit('add follower', addFollowingData)

    //当前用户作为followers去following其他用户
    const addFollowerToCache = followAndBlockCache.saveFollowerToCache(`following:${followerId}`, `${req.currentUser!.userId}`)
    //其他用户作为被following的对象放入following中
    const addFollowingToCache = followAndBlockCache.saveFollowerToCache(`followers:${req.currentUser!.userId}`, `${followerId}`)

    await Promise.all([addFollowerToCache, addFollowingToCache])

    followerQueue.addFollowerJob('addFollowerToDB', {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: `${followerId}`,
      username: req.currentUser!.username,
      followerDocumentId: followerObjectId
    })

    resp.status(HTTP_STATUS.OK).json({ message: `${req.currentUser!.userId}关注${followerId}成功` })
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