import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { PostCache } from '@/shared/services/redis/post.cache'
import { postQueue } from '@/shared/services/queues/post.queue'
import { socketIOPostObject } from '@/shared/sockets/post'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { postSchema } from '../schemes/post.scheme'
import { IPostDocument } from '../interfaces/post.interface'

const postCache: PostCache = new PostCache()

export class UpdatePost {
  @joiValidation(postSchema)
  public async updatePost(req: Request, resp: Response): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body
    const { postId } = req.params

    const updatedPostData: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion
    } as IPostDocument

    const updatedPost: IPostDocument = await postCache.updatePostInCache(postId, updatedPostData)
    socketIOPostObject.emit('update post', updatedPost, 'posts')
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost })
    resp.status(HTTP_STATUS.OK).json({ message: 'post更新成功' })
  }
}