import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { PostCache } from '@/shared/services/redis/post.cache'
import { postQueue } from '@/shared/services/queues/post.queue'
import { socketIOPostObject } from '@/shared/sockets/post'
import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { postSchema } from '../schemes/post.scheme'
import { IPostDocument } from '../interfaces/post.interface'
import { postWithImageSchema, postWithVideoSchema } from '../schemes/post.scheme'
import { cloudinaryUploads, videoUpload } from '@/shared/global/helpers/cloudinaryUpload'
import { BadRequestError } from '@/shared/global/helpers/errorHandler'
import { UploadApiResponse } from 'cloudinary'
import { imageQueue } from '@/shared/services/queues/image.queue'

const postCache: PostCache = new PostCache()

export class UpdatePost {
  @joiValidation(postSchema)
  public async updatePost(req: Request, resp: Response): Promise<void> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
      videoId = '',
      videoVesion = ''
    } = req.body
    const { postId } = req.params

    const updatedPostData: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion,
      videoId,
      videoVesion
    } as unknown as IPostDocument

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

  @joiValidation(postWithVideoSchema)
  public async postWithVideo(req: Request, res: Response): Promise<void> {
    const { videoId, videoVersion } = req.body
    if (videoId && videoVersion) {
      UpdatePost.prototype.updateImagePost(req)
    } else {
      const result: UploadApiResponse = await UpdatePost.prototype.updateImageToExistingPost(req)
      if (!result.public_id) {
        throw new BadRequestError(result.message)
      }
    }
    res.status(HTTP_STATUS.OK).json({ message: 'Post with video updated successfully' })
  }

  private async updateImagePost(req: Request): Promise<void> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
      videoId = '',
      videoVersion = ''
    } = req.body
    const { postId } = req.params

    const updatedPostData: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion,
      videoId,
      videoVersion
    } as IPostDocument

    const updatedPost: IPostDocument = await postCache.updatePostInCache(postId, updatedPostData)
    socketIOPostObject.emit('update post', updatedPost, 'posts')
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost })
  }

  private async updateImageToExistingPost(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, image, profilePicture, video } = req.body
    const { postId } = req.params

    const result: UploadApiResponse = image
      ? ((await cloudinaryUploads(image)) as UploadApiResponse)
      : ((await videoUpload(video)) as UploadApiResponse)
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
      imgId: image ? result.public_id : '',
      imgVersion: image ? result.version.toString() : '',
      videoId: video ? result.public_id : '',
      videoVersion: video ? result.version.toString() : ''
    } as IPostDocument

    const updatedPost: IPostDocument = await postCache.updatePostInCache(postId, updatedPostData)
    socketIOPostObject.emit('update post', updatedPost, 'posts')
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost })
    imageQueue.addImageJob('addImageToDB', {
      key: `${req.currentUser!.userId}`,
      imageId: result.public_id,
      imgVersion: result.version.toString()
    })

    return result
  }
}