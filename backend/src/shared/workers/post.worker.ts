import { Job, DoneCallback } from 'bull'
import Logger from 'bunyan'

import { config } from '@/config'
import { postService } from '../services/db/post.service'

const logger: Logger = config.createLogger('postWorker')

class PostWorker {
  async saveToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data
      await postService.addPostsToDB(key, value)
      job.progress(100)
      done(null, job.data)
    } catch (error) {
      logger.error(error)
      done(error as Error)
    }
  }
}

export const postWorker: PostWorker = new PostWorker()