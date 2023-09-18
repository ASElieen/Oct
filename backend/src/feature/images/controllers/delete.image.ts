import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { UserCache } from '@/shared/services/redis/user.cache'
import { socketIOImageObject } from '@/shared/sockets/images'
import { imageQueue } from '@shared/services/queues/image.queue'
import { imageService } from '@/shared/services/db/image.service'

const userCache: UserCache = new UserCache()

export class DeleteImage {
  public async deleteImage(req: Request, resp: Response): Promise<void> {
    const { imageId } = req.params
    socketIOImageObject.emit('delete image', imageId)
    imageQueue.addImageJob('removeImageFromDB', { imageId })
    resp.status(HTTP_STATUS.OK).json({ message: '该图片已成功删除' })
  }

  public async deleteBackgroundImage(req: Request, resp: Response): Promise<void> {
    const image = await imageService.getImageByBackgroundId(req.params.bgImageId)
    socketIOImageObject.emit('delete image', image._id)
    const bgImageId = userCache.updateSingleUserInCache(`${req.currentUser!.userId}`, 'bgImageId', '')
    const bgImageVersion = userCache.updateSingleUserInCache(`${req.currentUser!.userId}`, 'bgImageVersion', '')

    await Promise.all([bgImageId, bgImageVersion])
    imageQueue.addImageJob('removeImageFromDB', {
      imageId: image._id
    })
    resp.status(HTTP_STATUS.OK).json({ message: '该图片已成功删除' })
  }
}