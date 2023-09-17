import { BaseQueue } from './base.queue'
import { IEmailJob } from '@/feature/user/interfaces/user.interface'
import { emailWorker } from '../../workers/email.worker'

class MailQueue extends BaseQueue {
  constructor() {
    super('email')
    this.processJob('forgotPasswordEmail', 5, emailWorker.addNotificationEmail)
    this.processJob('commentEmail', 5, emailWorker.addNotificationEmail)
    this.processJob('followersEmail', 5, emailWorker.addNotificationEmail)
  }

  public addEmailJob(name: string, data: IEmailJob): void {
    this.addJob(name, data)
  }
}

export const mailQueue: MailQueue = new MailQueue()