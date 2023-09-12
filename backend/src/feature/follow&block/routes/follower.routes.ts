import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { AddFollower } from '../controllers/follow.user'
import { RemoveFollower } from '../controllers/unfollow.user'

class FollowerRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.put('/user/follow/:followerId', authMiddleware.checkAuthentication, AddFollower.prototype.followSomebody)
    this.router.put(
      '/user/unfollow/:followingId/:followerId',
      authMiddleware.checkAuthentication,
      RemoveFollower.prototype.removeFollower
    )

    return this.router
  }
}

export const followerRoutes: FollowerRoutes = new FollowerRoutes()