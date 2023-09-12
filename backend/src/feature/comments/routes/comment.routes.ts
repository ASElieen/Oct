import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { GetComment } from '../controllers/get.comment'
import { AddComment } from '../controllers/add.comment'

class CommentRoute {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.get('/post/comments/:postId', authMiddleware.checkAuthentication, GetComment.prototype.comments)
    this.router.get('/post/commentsnames/:postId', authMiddleware.checkAuthentication, GetComment.prototype.getCommentsNames)
    this.router.get(
      '/post/single/comment/:postId/:commentId',
      authMiddleware.checkAuthentication,
      GetComment.prototype.getSingleComment
    )

    this.router.post('/post/comment', authMiddleware.checkAuthentication, AddComment.prototype.comment)

    return this.router
  }
}

export const commentRoute: CommentRoute = new CommentRoute()