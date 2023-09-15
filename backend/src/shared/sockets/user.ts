import { ISocketData } from '@/feature/user/interfaces/user.interface'
import { Server, Socket } from 'socket.io'

export let socketIOUserObject: Server

export class SocketIOUserHandler {
  private io: Server
  constructor(io: Server) {
    this.io = io
    socketIOUserObject = io
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('block user', (data: ISocketData) => {
        this.io.emit('block user id', data)
      })

      socket.on('unblock user', (data: ISocketData) => {
        this.io.emit('unblock user id', data)
      })
    })
  }
}