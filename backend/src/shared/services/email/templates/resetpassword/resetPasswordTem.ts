import fs from 'fs'
import ejs from 'ejs'
import { IResetPasswordParams } from '@/feature/user/interfaces/user.interface'

class ResetPasswordTemplate {
  public passwordResetTemplate(params: IResetPasswordParams): string {
    const { username, email, ipaddress, date } = params
    return ejs.render(fs.readFileSync(__dirname + '/resetPassword.ejs', 'utf-8'), {
      username,
      email,
      ipaddress,
      date,
      image_url:
        'https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png'
    })
  }
}

export const resetPasswordTemplate: ResetPasswordTemplate = new ResetPasswordTemplate()