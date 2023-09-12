import { DoneCallback, Job } from 'bull'
import Logger from 'bunyan'

import { config } from '@/config'
import { commentService } from '../services/db/comment.service'

const logger: Logger = config.createLogger('commentWorker')

class CommentWorker {
  async addCommentToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { data } = job
      await commentService.addCommentToDB(data)
      job.progress(100)
      done(null, job.data)
    } catch (error) {
      logger.error(error)
      done(error as Error)
    }
  }
}

export const commentWorker: CommentWorker = new CommentWorker()