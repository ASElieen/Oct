import { Application } from 'express'
import { authRoutes } from '@feature/auth/routes/auth.routes'
import { currentUserRoute } from '@feature/auth/routes/current.routes'
import { postRoutes } from './feature/posts/routes/post.routes'
import { reactionRoutes } from './feature/reactions/routes/reaction.routes'
import { commentRoute } from './feature/comments/routes/comment.routes'
import { followerRoutes } from './feature/follow&block/routes/follower.routes'
import { imageRoutes } from './feature/images/routes/image.routes'

import { authMiddleware } from './shared/global/helpers/auth.middleware'
import { serverAdapter } from './shared/services/queues/base.queue'

const BASE_PATH = '/api/v1'

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter())
    app.use(BASE_PATH, authRoutes.routes())
    app.use(BASE_PATH, authRoutes.signoutRoute())

    app.use(BASE_PATH, authMiddleware.verifyUserToken, currentUserRoute.routes())
    app.use(BASE_PATH, authMiddleware.verifyUserToken, postRoutes.routes())

    app.use(BASE_PATH, authMiddleware.verifyUserToken, reactionRoutes.routes())

    app.use(BASE_PATH, authMiddleware.verifyUserToken, commentRoute.routes())

    app.use(BASE_PATH, authMiddleware.verifyUserToken, followerRoutes.routes())

    app.use(BASE_PATH, authMiddleware.verifyUserToken, imageRoutes.routes())
  }

  routes()
}
