import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'

import { FollowAndBlockCache } from '@shared/services/redis/follow&block.cache'
import { followerService } from '@/shared/services/db/follower.service'
import { IFollowerData } from '../interfaces/follow.block.interface'

const followAndBlockCache: FollowAndBlockCache = new FollowAndBlockCache()

export class GetFollowerOrFollowing {
  public async getCurrentUserFollowing(req: Request, resp: Response): Promise<void> {
    const userObjectId: ObjectId = new mongoose.Types.ObjectId(req.currentUser!.userId)
    const followingDataInCache: IFollowerData[] = await followAndBlockCache.getFollowersFromCache(
      `following:${req.currentUser!.userId}`
    )
    const following = followingDataInCache.length ? followingDataInCache : await followerService.getFollowingData(userObjectId)
    resp.status(HTTP_STATUS.OK).json({ message: 'Get User Following', following })
  }

  public async getUserFollowers(req: Request, resp: Response): Promise<void> {
    const userObjectId: ObjectId = new mongoose.Types.ObjectId(req.params.userId)
    const followerDataInCache: IFollowerData[] = await followAndBlockCache.getFollowersFromCache(`followers:${req.params.userId}`)
    const followers = followerDataInCache.length ? followerDataInCache : await followerService.getFollowerDataInDB(userObjectId)
    resp.status(HTTP_STATUS.OK).json({ message: 'Get User Followers', followers })
  }
}