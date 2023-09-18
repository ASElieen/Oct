import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { socketIONotificationObject } from '@/shared/sockets/notification'
import { notificationQueue } from '@/shared/services/queues/notification.queue'

export class DeleteNotification {
  public async deleteNotification(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params
    socketIONotificationObject.emit('delete notification', notificationId)
    notificationQueue.addNotificationJob('deleteNotification', { key: notificationId })
    res.status(HTTP_STATUS.OK).json({ message: '已成功删除该条提醒' })
  }
}