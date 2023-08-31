import { Request, Response, NextFunction } from 'express'
import JWT from 'jsonwebtoken'
import { config } from '@/config'
import { NotAuthorizedError } from './errorHandler'
import { AuthPayload } from '@feature/auth/interfaces/auth.interface'

export class AuthMiddleware {
  public verifyUserToken(req: Request, _resp: Response, next: NextFunction): void {
    if (!req.session?.jwt) {
      throw new NotAuthorizedError('token已过期或者不可用,请重新登录')
    }

    try {
      //获取JWT.sign的payload
      const payload = JWT.verify(req.session?.jwt, config.JWT_TOKEN!) as AuthPayload
      //挂到currentUser上让getUserFromCache获取
      req.currentUser = payload
    } catch (error) {
      throw new NotAuthorizedError('无效的token,请重新登录')
    }
    next()
  }

  //校验是否登录
  public checkAuthentication(req: Request, _resp: Response, next: NextFunction): void {
    if (!req.currentUser) {
      throw new NotAuthorizedError('该路由需要登录后才能生效')
    }
    next()
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware()