import { Query } from 'mongoose'

import { ICommentJob, IQueryComment, ICommentDocument, ICommentNameList } from '@/feature/comments/interfaces/comments.interface'
import { CommentsModel } from '@/feature/comments/models/comments.schema'
import { PostModel } from '@/feature/posts/models/post.schema'
import { UserCache } from '../redis/user.cache'

const userCache: UserCache = new UserCache()

class CommentService {
  public async addCommentToDB(commentData: ICommentJob): Promise<void> {
    const { userTo, userFrom, comment, postId, username } = commentData

    const comments = await CommentsModel.create(comment)
    const post = await PostModel.findOneAndUpdate({ _id: postId }, { $inc: { commentsCount: 1 } }, { new: true })
    const user = await userCache.getUserFromCache(userTo)

    //发送评论提醒
  }

  public async getPostComments(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentDocument[]> {
    const comments: ICommentDocument[] = await CommentsModel.aggregate([{ $match: query }, { $sort: sort }])
    return comments
  }

  public async getPostCommentNames(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentNameList[]> {
    const commentNameList: ICommentNameList[] = await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort },
      //$sum 1计数 匹配的username作为一个[]放到names这个自定义字段中 _id null将所有文档分为一组
      { $group: { _id: null, names: { $addToSet: '$username' }, count: { $sum: 1 } } },
      //删除group中返回的_id
      { $project: { _id: 0 } }
    ])

    return commentNameList
  }
}

export const commentService: CommentService = new CommentService()