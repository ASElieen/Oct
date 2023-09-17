import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import { ObjectId } from 'mongodb'
import { UploadApiResponse } from 'cloudinary'

import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { postSchema, postWithImageSchema } from '../schemes/post.scheme'
import { IPostDocument } from '../interfaces/post.interface'
import { PostCache } from '@/shared/services/redis/post.cache'
import { socketIOPostObject } from '@/shared/sockets/post'
import { postQueue } from '@shared/services/queues/post.queue'
import { BadRequestError } from '@/shared/global/helpers/errorHandler'
import { cloudinaryUploads } from '@/shared/global/helpers/cloudinaryUpload'
import { imageQueue } from '@/shared/services/queues/image.queue'

const postCache = new PostCache()

export class CreatePost {
  @joiValidation(postSchema)
  public async post(req: Request, resp: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body

    const postObjectId: ObjectId = new ObjectId()
    const createPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      createdAt: new Date(),
      //表情
      reactions: {
        like: 0,
        love: 0,
        happy: 0,
        sad: 0,
        angry: 0,
        wow: 0
      }
    } as IPostDocument

    //emit server端和client端都能通过add post拿到createPost
    //存入redis或者mongodb之前 用户就可以看到data了
    socketIOPostObject.emit('add post', createPost)

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost: createPost
    })

    postQueue.addPostJob('addPostsToDB', { key: req.currentUser!.userId, value: createPost })

    resp.status(HTTP_STATUS.CREATED).json({ message: '已成功创建post请求' })
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, resp: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } = req.body

    const result: UploadApiResponse = (await cloudinaryUploads(image)) as UploadApiResponse
    if (!result?.public_id) {
      throw new BadRequestError(result.message)
    }

    const postObjectId: ObjectId = new ObjectId()
    const createPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      createdAt: new Date(),
      //表情
      reactions: {
        like: 0,
        love: 0,
        happy: 0,
        sad: 0,
        angry: 0,
        wow: 0
      }
    } as IPostDocument

    //emit server端和client端都能通过add post拿到createPost
    //存入redis或者mongodb之前 用户就可以看到data了
    socketIOPostObject.emit('add post', createPost)

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost: createPost
    })

    postQueue.addPostJob('addPostsToDB', { key: req.currentUser!.userId, value: createPost })
    imageQueue.addImageJob('addImageToDB', {
      key: `${req.currentUser!.userId}`,
      imageId: result.public_id,
      imgVersion: result.version.toString()
    })

    resp.status(HTTP_STATUS.CREATED).json({ message: '已成功创建附带图片的post请求' })
  }
}