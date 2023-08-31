import { Application } from 'express'
import { authRoutes } from '@feature/auth/routes/auth.routes'
import { currentUserRoute } from '@feature/auth/routes/current.routes'

import { authMiddleware } from './shared/global/helpers/auth.middleware'
import { serverAdapter } from './shared/services/queues/base.queue'

const BASE_PATH = '/api/v1'

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter())
    app.use(BASE_PATH, authRoutes.routes())
    app.use(BASE_PATH, authRoutes.signoutRoute())
    app.use(BASE_PATH, authMiddleware.verifyUserToken, currentUserRoute.routes())
  }

  routes()
}
