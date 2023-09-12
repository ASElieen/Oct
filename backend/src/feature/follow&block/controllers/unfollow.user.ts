import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { FollowAndBlockCache } from '@/shared/services/redis/follow&block.cache'
import { followerQueue } from '@/shared/services/queues/follower.queue'

const followAndBlockCache: FollowAndBlockCache = new FollowAndBlockCache()

export class RemoveFollower {
  public async removeFollower(req: Request, resp: Response): Promise<void> {
    const { followingId, followerId } = req.params
    const removeFollowerFromCache: Promise<void> = followAndBlockCache.removeFollowerFromCache(
      `following:${req.currentUser!.userId}`,
      followerId
    )
    const removeFollowingFromCache: Promise<void> = followAndBlockCache.removeFollowerFromCache(
      `followers:${followerId}`,
      followingId
    )

    const followingCount = followAndBlockCache.updateFollowerCountInCache(`${followingId}`, 'followingCount', -1)
    const followerCount = followAndBlockCache.updateFollowerCountInCache(`${followerId}`, 'followerCount', -1)
    await Promise.all([removeFollowerFromCache, removeFollowingFromCache, followingCount, followerCount])

    followerQueue.addFollowerJob('removeFollowerFromDB', {
      keyOne: `${followingId}`,
      keyTwo: `${followerId}`
    })

    resp.status(HTTP_STATUS.OK).json({ message: `${req.currentUser!.userId}取关${followerId}成功` })
  }
}