import express, { Router } from 'express'
import { CurrentUser } from '../controllers/current.user'
import { authMiddleware } from '@shared/global/helpers/auth.middleware'

class CurrentUserRoute {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.get('/currentuser', authMiddleware.checkAuthentication, CurrentUser.prototype.read)
    return this.router
  }
}

export const currentUserRoute: CurrentUserRoute = new CurrentUserRoute()