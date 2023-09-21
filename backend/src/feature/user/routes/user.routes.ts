import express, { Router } from 'express'

import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { GetUsers } from '../controller/get.userProfile'
import { SearchUser } from '../controller/search.user'

class UserRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.get('/user/all/:page', authMiddleware.checkAuthentication, GetUsers.prototype.all)
    this.router.get('/user/profile', authMiddleware.checkAuthentication, GetUsers.prototype.currentUserProfile)
    this.router.get('/user/profile/:userId', authMiddleware.checkAuthentication, GetUsers.prototype.profileByUserId)
    this.router.get(
      '/user/profile/posts/:username/:userId/:uId',
      authMiddleware.checkAuthentication,
      GetUsers.prototype.profileAndPosts
    )
    this.router.get(
      '/user/profile/strangers/suggestions',
      authMiddleware.checkAuthentication,
      GetUsers.prototype.randomUserSuggestions
    )
    this.router.get('/user/profile/search/:query', authMiddleware.checkAuthentication, SearchUser.prototype.search)

    return this.router
  }
}

export const userRoutes: UserRoutes = new UserRoutes()