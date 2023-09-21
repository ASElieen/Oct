import { BaseQueue } from './base.queue'
import { userWorker } from '@/shared/workers/user.worker'

class UserQueue extends BaseQueue {
  constructor() {
    super('user')
    //添加到队列后便会执行
    this.processJob('addUserToMongoDB', 5, userWorker.addUserToDB)
    this.processJob('updateUserInfo', 5, userWorker.updateUserInfo)
    this.processJob('updateSocialLinks', 5, userWorker.updateSocialLinks)
  }

  //在signup中把job添加到队列
  public addUserJob(name: string, data: any) {
    this.addJob(name, data)
  }
}

export const userQueue: UserQueue = new UserQueue()