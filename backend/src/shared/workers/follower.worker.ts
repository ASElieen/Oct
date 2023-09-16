import { DoneCallback, Job } from 'bull'
import Logger from 'bunyan'

import { config } from '@/config'
import { followerService } from '../services/db/follower.service'

const logger: Logger = config.createLogger('followerWorker')

class FollowerWorker {
  async addFollowerToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      //keyOne:userId keyTwo:followingId
      const { keyOne, keyTwo, username, followerDocumentId } = job.data
      await followerService.addFollowerToDB(keyOne, keyTwo, username, followerDocumentId)
      job.progress(100)
      done(null, job.data)
    } catch (error) {
      logger.error(error)
      done(error as Error)
    }
  }

  async removeFollowerFromDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      //keyone followingId keytwo followerId
      const { keyOne, keyTwo } = job.data
      await followerService.removeFollowerFromDB(keyOne, keyTwo)
      job.progress(100)
      done(null, job.data)
    } catch (error) {
      logger.error(error)
      done(error as Error)
    }
  }
}

export const followerWorker: FollowerWorker = new FollowerWorker()