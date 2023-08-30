import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

export class SignOut {
  public async update(req: Request, resp: Response) {
    req.session = null
    resp.status(HTTP_STATUS.OK).json({ message: '已退出登录', user: {}, token: '' })
  }
}

