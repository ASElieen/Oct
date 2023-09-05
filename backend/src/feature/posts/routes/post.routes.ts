import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { CreatePost } from '../controllers/create.post'
import { GetPost } from '../controllers/get.post'
import express, { Router } from 'express'
import { DeletePost } from '../controllers/delete.post'
import { UpdatePost } from '../controllers/update.post'

class PostRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.get('/post/all/:page', authMiddleware.checkAuthentication, GetPost.prototype.getAllposts)
    this.router.get('/post/images/:page', authMiddleware.checkAuthentication, GetPost.prototype.getAllpostsWithImages)

    this.router.post('/post', authMiddleware.checkAuthentication, CreatePost.prototype.post)
    this.router.post('/post/postimage', authMiddleware.checkAuthentication, CreatePost.prototype.postWithImage)

    this.router.delete('/post/images/:postId', authMiddleware.checkAuthentication, DeletePost.prototype.delete)

    this.router.put('/post/update/:postId', authMiddleware.checkAuthentication, UpdatePost.prototype.updatePost)
    this.router.put('/post/update/image/:postId', authMiddleware.checkAuthentication, UpdatePost.prototype.postWithImage)
    return this.router
  }
}

export const postRoutes: PostRoutes = new PostRoutes()