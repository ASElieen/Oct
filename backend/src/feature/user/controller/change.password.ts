import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import moment from 'moment'
import publicIP from 'ip'

import { changePasswordSchema } from '../schemes/info'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { BadRequestError } from '@/shared/global/helpers/errorHandler'
import { IAuthDocument } from '../../auth/interfaces/auth.interface'
import { authService } from '@shared/services/db/auth.service'
import { userService } from '@/shared/services/db/user.service'
import { IResetPasswordParams } from '../interfaces/user.interface'
import { mailQueue } from '@/shared/services/queues/email.queue'
import { resetPasswordTemplate } from '@/shared/services/email/templates/resetpassword/resetPasswordTem'

export class Update {
  @joiValidation(changePasswordSchema)
  public async changePassword(req: Request, resp: Response): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = req.body
    if (newPassword !== confirmPassword) {
      throw new BadRequestError('两次输出密码不一致，请重试')
    }

    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(req.currentUser!.username)
    const passwordMatch: boolean = await existingUser.comparePassword(currentPassword)
    if (!passwordMatch) throw new BadRequestError('密码输入错误，请重试')

    const hashedPassword: string = await existingUser.hashPassword(newPassword)
    userService.updatePassword(`${req.currentUser!.username}`, hashedPassword)

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    }

    const template: string = resetPasswordTemplate.passwordResetTemplate(templateParams)
    mailQueue.addEmailJob('changePassword', {
      template,
      receiverEmail: existingUser.email!,
      subject: 'Password update confirmation'
    })
    resp.status(HTTP_STATUS.OK).json({
      message: '已成功重置密码,请重新登录.'
    })
  }
}