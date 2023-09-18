import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import { UploadApiResponse } from 'cloudinary'

import { UserCache } from '@/shared/services/redis/user.cache'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { addImageSchema } from '../schemes/image.scheme'
import { cloudinaryUploads } from '@/shared/global/helpers/cloudinaryUpload'
import { BadRequestError } from '@/shared/global/helpers/errorHandler'
import { config } from '@/config'
import { IUserDocument } from '@/feature/user/interfaces/user.interface'
import { socketIOImageObject } from '@/shared/sockets/images'
import { imageQueue } from '@shared/services/queues/image.queue'
import { IBgUploadResponse } from '../interfaces/image.interface'
import { Helpers } from '@/shared/global/helpers/helper'

const userCache: UserCache = new UserCache()

export class AddImage {
  @joiValidation(addImageSchema)
  public async profileImage(req: Request, resp: Response): Promise<void> {
    //public_id = req.currentUser!.userId
    const result: UploadApiResponse = (await cloudinaryUploads(
      req.body.image,
      req.currentUser!.userId,
      true,
      true
    )) as UploadApiResponse

    if (!result?.public_id) {
      throw new BadRequestError('profileImage上传失败,请重试')
    }

    const url = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`

    const cachedUser: IUserDocument = (await userCache.updateSingleUserInCache(
      `${req.currentUser!.userId}`,
      'profilePicture',
      url
    )) as IUserDocument

    socketIOImageObject.emit('update user', cachedUser)

    imageQueue.addImageJob('addUserProfileImageToDB', {
      key: `${req.currentUser!.userId}`,
      value: url,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    })

    resp.status(HTTP_STATUS.OK).json({ message: '已成功添加image图片' })
  }

  public async backgroundImage(req: Request, res: Response): Promise<void> {
    const { version, publicId } = await AddImage.prototype.backgroundUpload(req.body.image)
    const bgImageId = userCache.updateSingleUserInCache(`${req.currentUser!.userId}`, 'bgImageId', publicId)
    const bgImageVersion = userCache.updateSingleUserInCache(`${req.currentUser!.userId}`, 'bgImageVersion', version)
    const resp = await Promise.all([bgImageId, bgImageVersion])

    socketIOImageObject.emit('update user', {
      bgImageId: publicId,
      bgImageVersion: version,
      userId: resp[0]
    })

    imageQueue.addImageJob('updateBGImageInDB', {
      key: `${req.currentUser!.userId}`,
      imgId: publicId,
      imgVersion: version.toString()
    })

    res.status(HTTP_STATUS.OK).json({ message: '已成功添加背景图片' })
  }

  private async backgroundUpload(image: string): Promise<IBgUploadResponse> {
    const isDataUrl = Helpers.isDataUrl(image)
    let version = ''
    let publicId = ''
    //base64
    if (isDataUrl) {
      const result: UploadApiResponse = (await cloudinaryUploads(image)) as UploadApiResponse
      if (!result.public_id) {
        throw new BadRequestError(result.message)
      } else {
        version = result.version.toString()
        publicId = result.public_id
      }
      //非base64
      //"https://res.cloudinary.com/dzsiffatq/image/upload/v1694504474/650016195facee4b232617de"
      //v1694504474  650016195facee4b232617de
    } else {
      const value = image.split('/')
      version = value[value.length - 2]
      publicId = value[value.length - 1]
    }
    return { version: version.replace(/v/g, ''), publicId }
  }
}