import { ISenderReceiver } from '@/feature/chat/interfaces/chat.interface'
import { Server, Socket } from 'socket.io'

import { connectedUserMap } from './user'

export let socketIOChatObject: Server

export class SocketIOChatHandler {
  private io: Server

  constructor(io: Server) {
    this.io = io
    socketIOChatObject = io
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('join room', (data: ISenderReceiver) => {
        const { senderName, receiverName } = data
        //通过username拿到socket.id
        const senderSocketId: string = connectedUserMap.get(senderName) as string
        const receiverSocketId: string = connectedUserMap.get(receiverName) as string
        //join room
        socket.join(senderSocketId)
        socket.join(receiverSocketId)
      })
    })
  }
}