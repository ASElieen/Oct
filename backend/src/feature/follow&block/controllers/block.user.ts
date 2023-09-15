import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { FollowAndBlockCache } from '@/shared/services/redis/follow&block.cache'
import { blockUserQueue } from '@/shared/services/queues/block.queue'

const followAndBlockCache: FollowAndBlockCache = new FollowAndBlockCache()

export class BlockUser {
  public async block(req: Request, resp: Response): Promise<void> {
    const { followerId } = req.params
    BlockUser.prototype.updateBlockedUser(followerId, `${req.currentUser!.userId}`, 'block')
    blockUserQueue.addBlockUserJob('addBlockedUserToDB', {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: `${followerId}`,
      type: 'block'
    })
    resp.status(HTTP_STATUS.OK).json({ message: `已将${followerId}添加到黑名单` })
  }

  public async unblock(req: Request, resp: Response): Promise<void> {
    const { followerId } = req.params
    BlockUser.prototype.updateBlockedUser(followerId, `${req.currentUser!.userId}`, 'unblock')
    blockUserQueue.addBlockUserJob('removeBlockedUserFromDB', {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: `${followerId}`,
      type: 'unblock'
    })
    resp.status(HTTP_STATUS.OK).json({ message: `已将${followerId}从黑名单中移除` })
  }

  private async updateBlockedUser(followerId: string, userId: string, type: 'block' | 'unblock'): Promise<void> {
    await followAndBlockCache.updateBlockPropInCache(`${userId}`, 'blocked', `${followerId}`, type)
    await followAndBlockCache.updateBlockPropInCache(`${followerId}`, 'blockedBy', `${userId}`, type)
  }
}

