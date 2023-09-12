import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { AddFollower } from '../controllers/follow.user'

class FollowerRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.put('/user/follow/:followerId', authMiddleware.checkAuthentication, AddFollower.prototype.followSomebody)

    return this.router
  }
}

export const followerRoutes: FollowerRoutes = new FollowerRoutes()