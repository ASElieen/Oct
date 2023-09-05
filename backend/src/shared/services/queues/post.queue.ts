import { IPostJobData } from '@feature/posts/interfaces/post.interface'
import { BaseQueue } from './base.queue'
import { postWorker } from '@/shared/workers/post.worker'

class PostQueue extends BaseQueue {
  constructor() {
    super('posts')
    this.processJob('addPostsToDB', 5, postWorker.saveToDB)
    this.processJob('deletePostFromDB', 5, postWorker.deletePostFromDB)
    this.processJob('updatePostInDB', 5, postWorker.updatePostInDB)
  }

  public addPostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data)
  }
}

export const postQueue: PostQueue = new PostQueue()