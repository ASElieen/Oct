import { ObjectId } from 'mongodb'
import { Request, Response } from 'express'
import { UploadApiResponse } from 'cloudinary'
import HTTP_STATUS from 'http-status-codes'
import { omit } from 'lodash'
import JWT from 'jsonwebtoken'

import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { signupSchema } from '../schemes/signup'
import { IAuthDocument, ISignUpData } from '../interfaces/auth.interface'
import { authService } from '@shared/services/db/auth.service'
import { BadRequestError } from '@shared/global/helpers/errorHandler'
import { Helpers } from '@/shared/global/helpers/helper'
import { cloudinaryUploads } from '@/shared/global/helpers/cloudinaryUpload'
import { IUserDocument } from '@feature/user/interfaces/user.interface'
import { UserCache } from '@shared/services/redis/user.cache'
import { config } from '@/config'
import { authQueue } from '@/shared/services/queues/auth.queue'
import { userQueue } from '../../../shared/services/queues/user.queue'

const userCache: UserCache = new UserCache()

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

    //该id对应每个user中的authId
    const authObjectId: ObjectId = new ObjectId()
    //用户更改头像时，objectId不变，通过该Id在cloudinary中覆盖旧头像
    const userObjectId: ObjectId = new ObjectId()
    //存入redis使用的id
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

    //存入redis
    const userDataForCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId)
    userDataForCache.profilePicture = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache)

    //存入mongodb
    omit(userDataForCache, ['uId', 'username', 'email', 'avatarColor', 'password'])
    authQueue.addAuthUserJob('addAuthUserToMongoDB', { value: userDataForCache })
    userQueue.addUserJob('addUserToMongoDB', { value: userDataForCache })

    const userJWT: string = SignUp.prototype.signToken(authData, userObjectId)
    //session存在服务端
    req.session = { jwt: userJWT }

    resp.status(HTTP_STATUS.CREATED).json({ message: '创建用户成功', user: userDataForCache, token: userJWT })
  }

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_TOKEN!
    )
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

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterToUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageId: '',
      bgImageVersion: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument
  }
}