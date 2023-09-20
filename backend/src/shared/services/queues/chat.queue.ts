import { chatWorker } from '@/shared/workers/chat.worker'
import { BaseQueue } from './base.queue'
import { IChatJobData, IMessageData } from '@/feature/chat/interfaces/chat.interface'

class ChatQueue extends BaseQueue {
  constructor() {
    super('chats')
    this.processJob('addChatMessageToDB', 5, chatWorker.addChatMessageToDB)
    this.processJob('markMessageAsDeleted', 5, chatWorker.markMessageAsDeleted)
    this.processJob('markMessagesAsReadInDB', 5, chatWorker.markMessagesAsReadInDB)
  }

  public addChatJob(name: string, data: IChatJobData | IMessageData): void {
    this.addJob(name, data)
  }
}

export const chatQueue: ChatQueue = new ChatQueue()