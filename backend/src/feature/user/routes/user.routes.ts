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

    return this.router
  }
}

export const userRoutes: UserRoutes = new UserRoutes()