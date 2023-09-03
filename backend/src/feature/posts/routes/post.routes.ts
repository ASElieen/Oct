import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { CreatePost } from '../controllers/create.post'
import express, { Router } from 'express'

class PostRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.post('/post', authMiddleware.checkAuthentication, CreatePost.prototype.post)
    this.router.post('/post/postimage', authMiddleware.checkAuthentication, CreatePost.prototype.postWithImage)
    return this.router
  }
}

export const postRoutes: PostRoutes = new PostRoutes()