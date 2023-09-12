import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import { ObjectId } from 'mongodb'

import { joiValidation } from '@/shared/global/decorators/joiValidation.decorator'
import { addCommentSchema } from '../schemes/comments.scheme'
import { ICommentDocument, ICommentJob } from '@/feature/comments/interfaces/comments.interface'
import { CommentsCache } from '@/shared/services/redis/comments.cache'
import { commentQueue } from '@/shared/services/queues/comment.queue'

const commentCache: CommentsCache = new CommentsCache()

export class AddComment {
  @joiValidation(addCommentSchema)
  public async comment(req: Request, resp: Response): Promise<void> {
    const { userTo, postId, profilePicture, comment } = req.body
    const commentObjectId = new ObjectId()
    const commentData = {
      _id: commentObjectId,
      postId,
      username: `${req.currentUser?.username}`,
      avatarColor: `${req.currentUser?.avatarColor}`,
      profilePicture,
      comment,
      createdAt: new Date()
    } as ICommentDocument

    await commentCache.savePostCommentsToCache(postId, JSON.stringify(commentData))

    const databaseCommentData: ICommentJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      comment: commentData
    }

    commentQueue.addCommentJob('addCommentToDB', databaseCommentData)
    resp.status(HTTP_STATUS.OK).json({ message: '成功创建新的评论内容' })
  }
}
