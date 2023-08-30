import { Request, Response } from 'express'
import JWT from 'jsonwebtoken'
import HTTP_STATUS from 'http-status-codes'

import { config } from '@/config'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { authService } from '@/shared/services/db/auth.service'
import { BadRequestError } from '@/shared/global/helpers/errorHandler'
import { loginSchema } from '../schemes/signin'

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, resp: Response): Promise<void> {
    const { username, password } = req.body
    const existUser = await authService.getAuthUserByUsername(username)
    if (!existUser) {
      throw new BadRequestError('该用户不存在')
    }

    const passwordsMatch = await existUser.comparePassword(password)
    if (!passwordsMatch) throw new BadRequestError('密码错误')

    const userJWT = JWT.sign(
      {
        userId: existUser._id,
        uId: existUser.uId,
        email: existUser.email,
        username: existUser.username,
        avatarColor: existUser.avatarColor
      },
      config.JWT_TOKEN!
    )

    req.session = { jwt: userJWT }

    resp.status(HTTP_STATUS.OK).json({ message: '登录成功', user: existUser, token: userJWT })
  }
}