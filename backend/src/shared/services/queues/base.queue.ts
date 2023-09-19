import Queue, { Job } from 'bull'
import Logger from 'bunyan'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { config } from '@/config'
import { IAuthJob } from '@/feature/auth/interfaces/auth.interface'
import { IEmailJob } from '@/feature/user/interfaces/user.interface'
import { IPostJobData } from '@feature/posts/interfaces/post.interface'
import { IReactionJob } from '@feature/reactions/interfaces/reactions.interface'
import { ICommentJob } from '@/feature/comments/interfaces/comments.interface'
import { IFollowerJobData } from '@feature/follow&block/interfaces/follow.block.interface'
import { IChatJobData, IMessageData } from '@feature/chat/interfaces/chat.interface'

type IBaseJobData =
  | IAuthJob
  | IEmailJob
  | IPostJobData
  | IReactionJob
  | ICommentJob
  | IFollowerJobData
  | IChatJobData
  | IMessageData

let bullAdapters: BullAdapter[] = []
export let serverAdapter: ExpressAdapter

export abstract class BaseQueue {
  queue: Queue.Queue
  log: Logger

  constructor(queueName: string) {
    this.queue = new Queue(queueName, `${config.REDIS_HOST}`)

    //bull ui
    bullAdapters.push(new BullAdapter(this.queue))
    bullAdapters = [...new Set(bullAdapters)]
    serverAdapter = new ExpressAdapter()
    serverAdapter.setBasePath('/queues')

    createBullBoard({
      queues: bullAdapters,
      serverAdapter
    })

    this.log = config.createLogger(`${queueName} Queue`)

    //监听事件
    this.queue.on('completed', (job: Job) => {
      job.remove()
    })

    this.queue.on('global:completed', (JobId: string) => {
      this.log.info(`job ${JobId} completed`)
    })

    this.queue.on('global:stored', (JobId: string) => {
      this.log.info(`job ${JobId} is stored`)
    })
  }

  protected addJob(name: string, data: IBaseJobData): void {
    //attempts为重试次数 backoff为失败后几秒重试
    this.queue.add(name, data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 } })
  }

  //concurrency为一次执行的job数
  protected processJob(name: string, concurrency: number, callback: Queue.ProcessCallbackFunction<void>): void {
    this.queue.process(name, concurrency, callback)
  }
}

