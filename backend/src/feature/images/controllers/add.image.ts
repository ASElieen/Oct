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
}