import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'

import { AddImage } from '../controllers/add.image'

class ImageRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.post('/images/profile', authMiddleware.checkAuthentication, AddImage.prototype.profileImage)
    this.router.post('/images/background', authMiddleware.checkAuthentication, AddImage.prototype.backgroundImage)

    return this.router
  }
}

export const imageRoutes: ImageRoutes = new ImageRoutes()