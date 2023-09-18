import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { imageService } from '@shared/services/db/image.service'

export class GetImage {
  public async getImages(req: Request, res: Response): Promise<void> {
    const { userId } = req.params
    const images = await imageService.getImages(userId)
    res.status(HTTP_STATUS.OK).json({ message: '已成功获取图片', images })
  }
}