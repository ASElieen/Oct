import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { INotificationDocument } from '@feature/notification/interfaces/notification.interface'
import { notificationService } from '@shared/services/db/notification.service'

export class GetNotification {
  public async getNotification(req: Request, resp: Response): Promise<void> {
    const notifications: INotificationDocument[] = await notificationService.getNotification(req.currentUser!.userId)
    resp.status(HTTP_STATUS.OK).json({ message: `已成功获取${req.currentUser!.userId}的所有提醒`, notifications })
  }
}