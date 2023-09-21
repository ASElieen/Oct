import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { UserCache } from '@/shared/services/redis/user.cache'
import { userQueue } from '@/shared/services/queues/user.queue'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { notificationSettingsSchema } from '../schemes/info'

const userCache: UserCache = new UserCache()

export class UpdateSettings {
  @joiValidation(notificationSettingsSchema)
  public async notification(req: Request, resp: Response): Promise<void> {
    await userCache.updateSingleUserInCache(`${req.currentUser!.userId}`, 'notifications', req.body)
    userQueue.addUserJob('updateNotificationSettings', {
      key: `${req.currentUser!.userId}`,
      value: req.body
    })
    resp.status(HTTP_STATUS.OK).json({ message: '已成功更改提醒设置', settings: req.body })
  }
}