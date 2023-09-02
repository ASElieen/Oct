import { Request, Response } from 'express'
import moment from 'moment'
import publicIP from 'ip'
import HTTP_STATUS from 'http-status-codes'
import crypto from 'crypto'

import { config } from '@/config'
import { authService } from '@/shared/services/db/auth.service'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { BadRequestError } from '@/shared/global/helpers/errorHandler'
import { emailSchema, passwordSchema } from '../schemes/password'
import { forgotPasswordTempate } from '@/shared/services/email/templates/forgotpassword/forgotPasswordTem'
import { mailQueue } from '@/shared/services/queues/email.queue'
import { resetPasswordTemplate } from '../../../shared/services/email/templates/resetpassword/resetPasswordTem'

export class Password {
  @joiValidation(emailSchema)
  //点击忘记密码发送邮件
  public async create(req: Request, resp: Response): Promise<void> {
    const { email } = req.body
    const existingUser = await authService.getAuthUserByEmail(email)
    if (!existingUser) throw new BadRequestError('无法通过email找到该用户,可能是错误的邮件地址')

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20))
    //hex => buffer to string
    const randomCharacters: string = randomBytes.toString('hex')
    await authService.updatePasswordToken(`${existingUser._id}`, randomCharacters, Date.now() + 60 * 60 * 1000)

    const resetLink = `${config.CLIENT_URL}/resetpassword?token=${randomCharacters}`
    const template = forgotPasswordTempate.passwordResetTemplate(existingUser.username!, resetLink)
    mailQueue.addEmailJob('forgotpasswordEmail', { template, receiverEmail: email, subject: '请重置您的密码' })
    resp.status(HTTP_STATUS.OK).json({ message: '您用于重置密码的邮件已经发送' })
  }

  //schema里有密码校验
  @joiValidation(passwordSchema)
  public async update(req: Request, resp: Response): Promise<void> {
    const { password } = req.body
    const { token } = req.params

    const existingUser = await authService.getAuthUserByPasswordToken(token)
    if (!existingUser) throw new BadRequestError('重置密码的token已过期')

    existingUser.password = password
    existingUser.passwordResetExpires = undefined
    existingUser.passwordResetToken = undefined

    await existingUser.save()

    const templateParams = {
      username: existingUser.username,
      email: existingUser.email,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    }

    const template = resetPasswordTemplate.passwordResetTemplate(templateParams)
    mailQueue.addEmailJob('forgotpasswordEmail', {
      template,
      receiverEmail: existingUser.email,
      subject: '密码已重置'
    })
    resp.status(HTTP_STATUS.OK).json({ message: '密码已重置，请重新登录' })
  }
}