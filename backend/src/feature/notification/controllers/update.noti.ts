import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { notificationQueue } from '@/shared/services/queues/notification.queue'
import { socketIONotificationObject } from '@/shared/sockets/notification'

export class UpdateNotification {
  public async updateNotification(req: Request, resp: Response): Promise<void> {
    const { notificationId } = req.params
    socketIONotificationObject.emit('update notification', notificationId)
    notificationQueue.addNotificationJob('updateNotification', { key: notificationId })
    resp.status(HTTP_STATUS.OK).json({ message: '该提醒已被标记为已读' })
  }
}
