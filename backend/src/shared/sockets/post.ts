import { Server, Socket } from 'socket.io'

export let socketIOPostObject: Server

//不用等待存入redis或者mongodb之后才得到信息
export class SocketIOPostHandler {
  private io: Server

  constructor(io: Server) {
    this.io = io
    //监听class之外的事件或者从外界emit事件进来
    socketIOPostObject = io
  }

  public listen(): void {
    //监听connection事件
    this.io.on('connection', (socket: Socket) => {
      console.log('Post socketio handler')
    })
  }
}