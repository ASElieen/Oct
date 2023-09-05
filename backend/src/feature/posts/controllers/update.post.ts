import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { PostCache } from '@/shared/services/redis/post.cache'
import { postQueue } from '@/shared/services/queues/post.queue'
import { socketIOPostObject } from '@/shared/sockets/post'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { postSchema } from '../schemes/post.scheme'
import { IPostDocument } from '../interfaces/post.interface'
import { postWithImageSchema } from '../schemes/post.scheme'
import { cloudinaryUploads } from '@/shared/global/helpers/cloudinaryUpload'
import { BadRequestError } from '@/shared/global/helpers/errorHandler'
import { UploadApiResponse } from 'cloudinary'

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

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, resp: Response): Promise<void> {
    const { imgId, imgVersion } = req.body
    //如果已经存在imgId和version了则不更新图片 否则上传新的图片
    if (imgId && imgVersion) {
      UpdatePost.prototype.updateImagePost(req)
    } else {
      const result = await UpdatePost.prototype.updateImageToExistingPost(req)
      if (!result.public_id) throw new BadRequestError(result.message)
    }

    resp.status(HTTP_STATUS.OK).json({ message: 'post with image更新成功' })
  }

  private async updateImagePost(req: Request): Promise<void> {
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
  }

  private async updateImageToExistingPost(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, image, profilePicture } = req.body
    const { postId } = req.params

    const result: UploadApiResponse = (await cloudinaryUploads(image)) as UploadApiResponse
    if (!result?.public_id) {
      return result
    }

    const updatedPostData: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    } as IPostDocument

    const updatedPost: IPostDocument = await postCache.updatePostInCache(postId, updatedPostData)
    socketIOPostObject.emit('update post', updatedPost, 'posts')
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost })

    return result
  }
}