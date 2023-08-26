import mongoose from "mongoose"

export default () => {
  const connect = async () => {
    try {
      await mongoose.connect("mongodb://0.0.0.0:27017/socialmedia")
      console.log("数据库链接成功")
    } catch (error) {
      console.log(`Error on database:${error}`)
    }
  }
  connect()

  //失败则重新链接
  mongoose.connection.on("disconnected", connect)
}
