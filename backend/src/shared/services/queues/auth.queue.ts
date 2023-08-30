import { BaseQueue } from './base.queue'
import { IAuthJob } from '@/feature/auth/interfaces/auth.interface'
import { authWorker } from '../../workers/auth.worker'

class AuthQueue extends BaseQueue {
  constructor() {
    super('auth')
    //添加到队列后便会执行
    this.processJob('addAuthUserToMongoDB', 5, authWorker.addAuthUserToDB)
  }

  //在signup中把job添加到队列
  public addAuthUserJob(name: string, data: IAuthJob) {
    this.addJob(name, data)
  }
}

export const authQueue: AuthQueue = new AuthQueue()