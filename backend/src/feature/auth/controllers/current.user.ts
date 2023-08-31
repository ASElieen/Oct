import { Request, Response } from 'express'
import { UserCache } from '@/shared/services/redis/user.cache'
import { IUserDocument } from '../../user/interfaces/user.interface'
import { userService } from '@/shared/services/db/user.service'
import HTTP_STATUS from 'http-status-codes'

const userCache: UserCache = new UserCache()

export class CurrentUser {
  public async read(req: Request, resp: Response) {
    let isUser = false
    let token = null
    let user = null

    //之前的namespace拿到currentUser
    const cacheUser = (await userCache.getUserFromCache(`${req.currentUser?.userId}`)) as IUserDocument
    const existingUser = cacheUser ? cacheUser : await userService.getUserByMongoId(`${req.currentUser?.userId}`)
    if (Object.keys(existingUser).length) {
      isUser = true
      token = req.session?.jwt
      user = existingUser
    }

    resp.status(HTTP_STATUS.OK).json({ token, isUser, user })
  }
}