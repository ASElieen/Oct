import { DoneCallback, Job } from 'bull'
import Logger from 'bunyan'

import { config } from '@/config'
import { chatService } from '../services/db/chat.service'

const logger: Logger = config.createLogger('chatWorker')

class ChatWorker {
  async addChatMessageToDB(jobQueue: Job, done: DoneCallback): Promise<void> {
    try {
      await chatService.addMessageToDB(jobQueue.data)
      jobQueue.progress(100)
      done(null, jobQueue.data)
    } catch (error) {
      logger.error(error)
      done(error as Error)
    }
  }

  async markMessageAsDeleted(jobQueue: Job, done: DoneCallback): Promise<void> {
    try {
      const { messageId, type } = jobQueue.data
      await chatService.markMessageAsDeleted(messageId, type)
      jobQueue.progress(100)
      done(null, jobQueue.data)
    } catch (error) {
      logger.error(error)
      done(error as Error)
    }
  }
}

export const chatWorker: ChatWorker = new ChatWorker()
