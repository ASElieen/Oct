import mongoose, { Query } from 'mongoose'

import { ICommentJob, IQueryComment, ICommentDocument, ICommentNameList } from '@/feature/comments/interfaces/comments.interface'
import { CommentsModel } from '@/feature/comments/models/comments.schema'
import { PostModel } from '@/feature/posts/models/post.schema'
import { UserCache } from '../redis/user.cache'
import { NotificationModel } from '@/feature/notification/models/notification.schema'
import { socketIONotificationObject } from '@/shared/sockets/notification'
import { notificationTemplate } from '../email/templates/notifications/notification.template'
import { INotificationTemplate } from '@feature/notification/interfaces/notification.interface'
import { mailQueue } from '../queues/email.queue'

const userCache: UserCache = new UserCache()

class CommentService {
  public async addCommentToDB(commentData: ICommentJob): Promise<void> {
    const { userTo, userFrom, comment, postId, username } = commentData

    const comments = await CommentsModel.create(comment)
    const post = await PostModel.findOneAndUpdate({ _id: postId }, { $inc: { commentsCount: 1 } }, { new: true })
    const user = await userCache.getUserFromCache(userTo)

    //发送评论提醒
    if (user?.notifications.comments && userFrom !== userTo) {
      const notificationModel = new NotificationModel()
      const notifications = await notificationModel.insertNotification({
        userFrom,
        userTo,
        message: `${username} commented on your post.`,
        notificationType: 'comment',
        entityId: new mongoose.Types.ObjectId(postId),
        createdItemId: new mongoose.Types.ObjectId(comments._id!),
        createdAt: new Date(),
        comment: comment.comment,
        post: post!.post,
        imgId: post!.imgId!,
        imgVersion: post!.imgVersion!,
        gifUrl: post!.gifUrl!,
        reaction: ''
      })
      //socket io send to client
      //client端 arg1 notifications arg2 userTo
      socketIONotificationObject.emit('insert notification', notifications, { userTo })

      const templateParams: INotificationTemplate = {
        username: post?.username!,
        message: `${username}新增了一条评论`,
        header: `一条新评论提醒`
      }

      const template: string = notificationTemplate.notificationMessageTemplate(templateParams)
      mailQueue.addEmailJob('commentEmail', { receiverEmail: post?.email!, template, subject: '一条新评论提醒' })
    }
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