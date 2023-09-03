import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import { ObjectId } from 'mongodb'

import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { postSchema } from '../schemes/post.scheme'
import { IPostDocument } from '../interfaces/post.interface'
import { PostCache } from '@/shared/services/redis/post.cache'
import { socketIOPostObject } from '@/shared/sockets/post'

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

    resp.status(HTTP_STATUS.CREATED).json({ message: '已成功创建post请求' })
  }
}