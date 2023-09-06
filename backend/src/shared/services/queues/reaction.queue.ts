import { IReactionJob } from '@feature/reactions/interfaces/reactions.interface'
import { BaseQueue } from './base.queue'
import { reactionWorker } from '@/shared/workers/reaction.worker'

class ReactionQueue extends BaseQueue {
  constructor() {
    super('reactions')
    this.processJob('addReactionToDB', 5, reactionWorker.addReactionToDB)
    this.processJob('removeReactionToDB', 5, reactionWorker.removeReactionFromDB)
  }

  public addReactionJob(name: string, data: IReactionJob): void {
    this.addJob(name, data)
  }
}

export const reactionQueue: ReactionQueue = new ReactionQueue()