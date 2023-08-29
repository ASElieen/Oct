import { ObjectId } from 'mongodb'
import { Request, Response } from 'express'
import { UploadApiResponse } from 'cloudinary'

import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { signupSchema } from '../schemes/signup'
import { IAuthDocument, ISignUpData } from '../interfaces/auth.interface'
import { authService } from '@shared/services/db/auth.service'
import { BadRequestError } from '@shared/global/helpers/errorHandler'
import { Helpers } from '@/shared/global/helpers/helper'
import { cloudinaryUploads } from '@/shared/global/helpers/cloudinaryUpload'

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, resp: Response) {
    //joi signupSchema
    const { username, email, password, avatarColor, avatarImage } = req.body
    const checkUserExist: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email)
    //如果用户已存在则报错
    if (checkUserExist) {
      throw new BadRequestError('该用户已经存在')
    }

    //该id对应每个user
    const authObjectId: ObjectId = new ObjectId()
    //用户更改头像时，objectId不变，通过该Id在cloudinary中覆盖旧头像
    const userObjectId: ObjectId = new ObjectId()
    const uId = `${Helpers.generateRandomNums(12)}`

    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor
    })

    //cloudinary
    const result: UploadApiResponse = (await cloudinaryUploads(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse

    if (!result?.public_id) {
      throw new BadRequestError('上传失败,发生未知错误，请重试')
    }
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data
    return {
      _id,
      uId,
      username: Helpers.firstLetterToUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date()
    } as unknown as IAuthDocument
  }
}