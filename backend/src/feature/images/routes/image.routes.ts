import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'

import { AddImage } from '../controllers/add.image'
import { DeleteImage } from '../controllers/delete.image'
import { GetImage } from '../controllers/get.image'

class ImageRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.post('/images/profile', authMiddleware.checkAuthentication, AddImage.prototype.profileImage)
    this.router.post('/images/background', authMiddleware.checkAuthentication, AddImage.prototype.backgroundImage)

    this.router.delete('/images/:imageId', authMiddleware.checkAuthentication, DeleteImage.prototype.deleteImage)
    this.router.delete(
      '/images/background/:bgImageId',
      authMiddleware.checkAuthentication,
      DeleteImage.prototype.deleteBackgroundImage
    )

    this.router.get('/images/:userId', authMiddleware.checkAuthentication, GetImage.prototype.getImages)

    return this.router
  }
}

export const imageRoutes: ImageRoutes = new ImageRoutes()