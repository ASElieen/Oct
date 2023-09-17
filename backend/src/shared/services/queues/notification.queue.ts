import { INotificationJobData } from '@feature/notification/interfaces/notification.interface'
import { BaseQueue } from './base.queue'
import { notificationWorker } from '@/shared/workers/notification.worker'

class NotificationQueue extends BaseQueue {
  constructor() {
    super('notification')
    this.processJob('updateNotification', 5, notificationWorker.updateNotification)
    this.processJob('deleteNotification', 5, notificationWorker.deleteNotification)
  }
  public addNotificationJob(name: string, data: INotificationJobData): void {
    this.addJob(name, data)
  }
}

export const notificationQueue: NotificationQueue = new NotificationQueue()
