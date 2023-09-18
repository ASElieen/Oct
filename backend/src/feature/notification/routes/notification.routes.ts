import express, { Router } from 'express'
import { authMiddleware } from '@/shared/global/helpers/auth.middleware'

import { UpdateNotification } from '../controllers/update.noti'
import { DeleteNotification } from '../controllers/delete.noti'
import { GetNotification } from '../controllers/get.noti'

class NotificationRoutes {
  private router: Router

  constructor() {
    this.router = express.Router()
  }

  public routes(): Router {
    this.router.put(
      '/notification/:notificationId',
      authMiddleware.checkAuthentication,
      UpdateNotification.prototype.updateNotification
    )

    this.router.delete(
      '/notification/:notificationId',
      authMiddleware.checkAuthentication,
      DeleteNotification.prototype.deleteNotification
    )

    this.router.get('/notifications', authMiddleware.checkAuthentication, GetNotification.prototype.getNotification)

    return this.router
  }
}

export const notificationRoutes: NotificationRoutes = new NotificationRoutes()