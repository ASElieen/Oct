import mongoose from 'mongoose'
import Logger from 'bunyan'
import { config } from './config'

const log: Logger = config.createLogger('setupDatabase')

export default () => {
  const connect = async () => {
    try {
      await mongoose.connect(config.DATABASE_URL!)
      log.info('数据库链接成功')
    } catch (error) {
      log.error(`Error on database:${error}`)
    }
  }
  connect()

  //失败则重新链接
  mongoose.connection.on('disconnected', connect)
}
