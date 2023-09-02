import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import Logger from 'bunyan'
import sendGridMail from '@sendgrid/mail'
import { config } from '@/config'
import { BadRequestError } from '@shared/global/helpers/errorHandler'

interface IMailOptions {
  from: string
  to: string
  subject: string
  html: string
}

const logger: Logger = config.createLogger('mailOptions')

sendGridMail.setApiKey(config.SENDGRID_API_KEY!)

class MailTransport {
  public async sendEmail(receiverEmail: string, subject: string, body: string): Promise<void> {
    if (config.NODE_ENV === 'test' || 'development') {
      this.devEmailSender(receiverEmail, subject, body)
    } else {
      this.productionEmailSender(receiverEmail, subject, body)
    }
  }

  //dev环境
  private async devEmailSender(receiverEmail: string, subject: string, body: string): Promise<void> {
    const transporter: Mail = nodemailer.createTransport({
      host: 'smtp.forwardemail.net',
      port: 465,
      secure: true,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: config.SENDER_EMAIL,
        pass: config.SENDER_EMAIL_PASSWORD
      }
    })

    const mailOptions: IMailOptions = {
      from: `${config.SENDER_EMAIL}`,
      to: receiverEmail,
      subject,
      html: body
    }

    try {
      await transporter.sendMail(mailOptions)
      logger.info('dev:邮件发送成功')
    } catch (error) {
      logger.error('Error:发送邮件时出现错误')
      throw new BadRequestError('发送邮件时出现错误')
    }
  }

  //product环境
  private async productionEmailSender(receiverEmail: string, subject: string, body: string): Promise<void> {
    const mailOptions: IMailOptions = {
      from: `${config.SENDER_EMAIL}`,
      to: receiverEmail,
      subject,
      html: body
    }

    try {
      await sendGridMail.send(mailOptions)
      logger.info('product:邮件发送成功')
    } catch (error) {
      logger.error('Error:发送邮件时出现错误')
      throw new BadRequestError('发送邮件时出现错误')
    }
  }
}

export const mailTransport: MailTransport = new MailTransport()
