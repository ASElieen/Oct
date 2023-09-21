import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { UserCache } from '@/shared/services/redis/user.cache'
import { userQueue } from '@/shared/services/queues/user.queue'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { basicInfoSchema, socialLinksSchema } from '../schemes/info'

const userCache: UserCache = new UserCache()

export class EditUser {
  public async updateInfo(req: Request, resp: Response): Promise<void> {
    for (const [key, value] of Object.entries(req.body)) {
      await userCache.updateSingleUserInCache(`${req.currentUser!.userId}`, key, `${value}`)
    }

    userQueue.addUserJob('updateUserInfo', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    })
    resp.status(HTTP_STATUS.OK).json({ message: '更新用户信息成功' })
  }

  @joiValidation(socialLinksSchema)
  public async updateSocialLink(req: Request, resp: Response): Promise<void> {
    await userCache.updateSingleUserInCache(`${req.currentUser!.userId}`, 'social', req.body)
    userQueue.addUserJob('updateSocialLinksInDB', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    })
    resp.status(HTTP_STATUS.OK).json({ message: '更新social link成功' })
  }
}