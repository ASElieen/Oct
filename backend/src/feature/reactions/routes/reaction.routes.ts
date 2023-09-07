import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { AddReactions } from '../controllers/add.reactions'
import { RemoveReactions } from '../controllers/remove.reaction'

class ReactionRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.post('/post/reaction', authMiddleware.checkAuthentication, AddReactions.prototype.add)
    this.router.delete(
      '/post/reaction/remove/:postId/:previousReaction/:postReaction',
      authMiddleware.checkAuthentication,
      RemoveReactions.prototype.remove
    )

    return this.router
  }
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes()