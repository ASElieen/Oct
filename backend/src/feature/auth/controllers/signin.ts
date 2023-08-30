import { Request, Response } from 'express'
import JWT from 'jsonwebtoken'
import HTTP_STATUS from 'http-status-codes'

import { config } from '@/config'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { authService } from '@/shared/services/db/auth.service'
import { BadRequestError } from '@/shared/global/helpers/errorHandler'
import { loginSchema } from '../schemes/signin'
import { userService } from '../../../shared/services/db/user.service'
import { IUserDocument } from '../../user/interfaces/user.interface'

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

    const user = await userService.getUserByMongoId(`${existUser._id}`)

    const userJWT = JWT.sign(
      {
        userId: user._id,
        uId: existUser.uId,
        email: existUser.email,
        username: existUser.username,
        avatarColor: existUser.avatarColor
      },
      config.JWT_TOKEN!
    )

    req.session = { jwt: userJWT }

    const userDocument: IUserDocument = {
      ...user,
      //aggregate查出的字段没有authId
      authId: existUser._id,
      username: existUser.username,
      email: existUser.email,
      avatarColor: existUser.avatarColor,
      uId: existUser.uId,
      createdAt: existUser.createdAt
    } as IUserDocument

    resp.status(HTTP_STATUS.OK).json({ message: '登录成功', user: userDocument, token: userJWT })
  }
}