import { IBlockedUserJobData } from '@/feature/follow&block/interfaces/follow.block.interface'
import { BaseQueue } from './base.queue'
import { blockWorker } from '@/shared/workers/block.worker'

class BlockUserQueue extends BaseQueue {
  constructor() {
    super('blockusers')
    this.processJob('addBlockedUserToDB', 5, blockWorker.addBlockUserToDB)
    this.processJob('removeBlockedUserFromDB', 5, blockWorker.addBlockUserToDB)
  }

  public addBlockUserJob(name: string, data: IBlockedUserJobData): void {
    this.addJob(name, data)
  }
}

export const blockUserQueue: BlockUserQueue = new BlockUserQueue()