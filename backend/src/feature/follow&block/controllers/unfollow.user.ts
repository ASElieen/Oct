import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { FollowAndBlockCache } from '@/shared/services/redis/follow&block.cache'
import { followerQueue } from '@/shared/services/queues/follower.queue'

const followAndBlockCache: FollowAndBlockCache = new FollowAndBlockCache()

export class RemoveFollower {
  //当前用户作为follower去following了其他用户
  public async removeFollower(req: Request, resp: Response): Promise<void> {
    const { followingId, followerId } = req.params
    const removeFollowerFromCache: Promise<void> = followAndBlockCache.removeFollowerFromCache(
      `following:${followingId}`,
      followerId
    )
    const removeFollowingFromCache: Promise<void> = followAndBlockCache.removeFollowerFromCache(
      `followers:${followerId}`,
      followingId
    )

    //当前用户作为follower 需要去更新followingCount
    const followingCount = followAndBlockCache.updateFollowerCountInCache(`${followerId}`, 'followingCount', -1)
    //其他用户作为被following的对象 需要去更新followerCount
    const followerCount = followAndBlockCache.updateFollowerCountInCache(`${followingId}`, 'followersCount', -1)
    await Promise.all([removeFollowerFromCache, removeFollowingFromCache, followingCount, followerCount])

    followerQueue.addFollowerJob('removeFollowerFromDB', {
      keyOne: `${followingId}`,
      keyTwo: `${followerId}`
    })

    resp.status(HTTP_STATUS.OK).json({ message: `${followerId}取关${followingId}成功` })
  }
}