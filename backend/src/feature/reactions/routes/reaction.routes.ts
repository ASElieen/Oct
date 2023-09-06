import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { AddReactions } from '../controllers/add.reactions'

class ReactionRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.post('/post/reaction', authMiddleware.checkAuthentication, AddReactions.prototype.add)

    return this.router
  }
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes()