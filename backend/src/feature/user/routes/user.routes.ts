import express, { Router } from 'express'

import { authMiddleware } from '@/shared/global/helpers/auth.middleware'
import { GetUsers } from '../controller/get.userProfile'
import { SearchUser } from '../controller/search.user'
import { Update } from '../controller/change.password'
import { EditUser } from '../controller/update.basicInfo'

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

    this.router.put('/user/profile/change_password', authMiddleware.checkAuthentication, Update.prototype.changePassword)
    this.router.put('/user/profile/basic_info', authMiddleware.checkAuthentication, EditUser.prototype.updateInfo)
    this.router.put('/user/profile/social_links', authMiddleware.checkAuthentication, EditUser.prototype.updateSocialLink)

    return this.router
  }
}

export const userRoutes: UserRoutes = new UserRoutes()