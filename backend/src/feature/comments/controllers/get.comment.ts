import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

import { ICommentDocument, ICommentNameList } from '@/feature/comments/interfaces/comments.interface'
import { CommentsCache } from '@/shared/services/redis/comments.cache'
import { commentService } from '@/shared/services/db/comment.service'

const commentCache: CommentsCache = new CommentsCache()

export class GetComment {
  public async comments(req: Request, resp: Response): Promise<void> {
    const { postId } = req.params
    const redisComments: ICommentDocument[] = await commentCache.getCommentsFromCache(postId)
    const comments: ICommentDocument[] = redisComments.length
      ? redisComments
      : await commentService.getPostComments({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 })

    resp.status(HTTP_STATUS.OK).json({ message: '成功获取到该post下的所有评论', comments })
  }

  public async getCommentsNames(req: Request, resp: Response): Promise<void> {
    const { postId } = req.params
    const commentNamesInCache: ICommentNameList = await commentCache.getCommentsNameFromCache(postId)
    const commentNames = commentNamesInCache
      ? commentNamesInCache
      : await commentService.getPostCommentNames({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 })

    resp.status(HTTP_STATUS.OK).json({ message: '获取所有评论的用户名成功', comments: commentNames ? commentNames : {} })
  }

  public async getSingleComment(req: Request, resp: Response): Promise<void> {
    const { postId, commentId } = req.params
    const redisComments: ICommentDocument[] = await commentCache.getSingleCommentFromCache(postId, commentId)
    const comments = redisComments
      ? redisComments
      : await commentService.getPostComments({ _id: new mongoose.Types.ObjectId(commentId) }, { createdAt: -1 })
    resp.status(HTTP_STATUS.OK).json({ message: '获取单个评论内容成功', comments })
  }
}