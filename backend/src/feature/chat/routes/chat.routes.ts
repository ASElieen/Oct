import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'

import { AddChat } from '../controller/add.chat'
import { GetChat } from '../controller/get.chat'
import { DeleteChat } from '../controller/delete.chat'
import { UpdateMessage } from '../controller/update.chat'
import { MsgReaction } from '../controller/add.message.reaction'

class ChatRoutes {
  private router: Router
  constructor() {
    this.router = express.Router()
  }
  public routes(): Router {
    this.router.post('/chat/message', authMiddleware.checkAuthentication, AddChat.prototype.addMessage)
    this.router.post('/chat/message/add_chat_users', authMiddleware.checkAuthentication, AddChat.prototype.addChatUsers)
    this.router.post('/chat/message/remove_chat_users', authMiddleware.checkAuthentication, AddChat.prototype.removeChatUsers)

    this.router.get('/chat/message/conversation_list', authMiddleware.checkAuthentication, GetChat.prototype.conversationList)
    this.router.get('/chat/message/user/:receiverId', authMiddleware.checkAuthentication, GetChat.prototype.messages)

    this.router.delete(
      '/chat/message/mark_as_deleted/:messageId/:senderId/:receiverId/:type',
      authMiddleware.checkAuthentication,
      DeleteChat.prototype.markMessageAsDeleted
    )

    this.router.put('/chat/message/mark_as_read', authMiddleware.checkAuthentication, UpdateMessage.prototype.updateMessage)
    this.router.put('/chat/message/reaction', authMiddleware.checkAuthentication, MsgReaction.prototype.updateReactions)

    return this.router
  }
}

export const chatRoutes: ChatRoutes = new ChatRoutes()