import { BaseQueue } from './base.queue'
import { IAuthJob } from '@/feature/auth/interfaces/auth.interface'

class AuthQueue extends BaseQueue {
  constructor() {
    super('auth')
  }

  public addAuthUserJob(name: string, data: IAuthJob) {
    this.addJob(name, data)
  }
}

export const authQueue: AuthQueue = new AuthQueue()