import mongoose from "mongoose"
import { config } from "./config"

export default () => {
  const connect = async () => {
    try {
      await mongoose.connect(config.DATABASE_URL!)
      console.log("数据库链接成功")
    } catch (error) {
      console.log(`Error on database:${error}`)
    }
  }
  connect()

  //失败则重新链接
  mongoose.connection.on("disconnected", connect)
}
