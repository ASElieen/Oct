import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { AddFollower } from '../controllers/follow.user'
import { RemoveFollower } from '../controllers/unfollow.user'
import { GetFollowerOrFollowing } from '../controllers/get.follow'
import { BlockUser } from '../controllers/block.user'

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

    this.router.get(
      '/user/following',
      authMiddleware.checkAuthentication,
      GetFollowerOrFollowing.prototype.getCurrentUserFollowing
    )
    this.router.get(
      '/user/followers/:userId',
      authMiddleware.checkAuthentication,
      GetFollowerOrFollowing.prototype.getUserFollowers
    )

    this.router.put('/user/block/:followerId', authMiddleware.checkAuthentication, BlockUser.prototype.block)
    this.router.put('/user/unblock/:followerId', authMiddleware.checkAuthentication, BlockUser.prototype.unblock)

    return this.router
  }
}

export const followerRoutes: FollowerRoutes = new FollowerRoutes()