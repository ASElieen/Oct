import express, { Router } from 'express'

import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { GetUsers } from '../controller/get.userProfile'

class UserRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.get('/user/all/:page', authMiddleware.checkAuthentication, GetUsers.prototype.all)
    this.router.get('/user/profile', authMiddleware.checkAuthentication, GetUsers.prototype.currentUserProfile)
    this.router.get('/user/profile/:userId', authMiddleware.checkAuthentication, GetUsers.prototype.profileByUserId)

    return this.router
  }
}

export const userRoutes: UserRoutes = new UserRoutes()