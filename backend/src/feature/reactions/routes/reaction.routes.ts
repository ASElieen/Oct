import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { AddReactions } from '../controllers/add.reactions'
import { RemoveReactions } from '../controllers/remove.reaction'
import { GetReaction } from '../controllers/get.reactions'

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

    this.router.get('/post/reactions/:postId', authMiddleware.checkAuthentication, GetReaction.prototype.getReaction)
    this.router.get(
      '/post/single/reaction/username/:postId/:username',
      authMiddleware.checkAuthentication,
      GetReaction.prototype.getReactionsByUsername
    )
    this.router.get('/post/reactions/username/:username', authMiddleware.checkAuthentication, GetReaction.prototype.getReaction)

    return this.router
  }
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes()