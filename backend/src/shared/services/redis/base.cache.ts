import { createClient } from 'redis'
import Logger from 'bunyan'
import { config } from '@/config'

//返回类型
export type RedisClient = ReturnType<typeof createClient>

export abstract class BaseCache {
  client: RedisClient
  log: Logger

  constructor(cachename: string) {
    this.client = createClient({ url: config.REDIS_HOST })
    this.log = config.createLogger(cachename)
    this.cacheError()
  }

  private cacheError(): void {
    this.client.on('error', (error: unknown) => {
      this.log.error(error)
    })
  }
}