import { DoneCallback, Job } from 'bull'
import Logger from 'bunyan'

import { config } from '@/config'
import { blockUserService } from '../services/db/block.service'

const logger: Logger = config.createLogger('blockWorker')

class BlockWorker {
  async addBlockUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { keyOne: userId, keyTwo: followerId, type } = job.data
      if (type === 'block') {
        await blockUserService.blockUser(userId, followerId)
      } else {
        await blockUserService.unblockUser(userId, followerId)
      }
      job.progress(100)
      done(null, job.data)
    } catch (error) {
      logger.error(error)
      done(error as Error)
    }
  }
}

export const blockWorker: BlockWorker = new BlockWorker()