import { ICommentJob } from '@/feature/comments/interfaces/comments.interface'
import { BaseQueue } from './base.queue'
import { commentWorker } from '@/shared/workers/comment.worker'

class CommentQueue extends BaseQueue {
  constructor() {
    super('comments')
    this.processJob('addCommentToDB', 5, commentWorker.addCommentToDB)
  }

  public addCommentJob(name: string, data: ICommentJob): void {
    this.addJob(name, data)
  }
}

export const commentQueue: CommentQueue = new CommentQueue()