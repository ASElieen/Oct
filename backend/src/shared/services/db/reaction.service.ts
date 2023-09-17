import mongoose from 'mongoose'

import { IReactionJob, IReactionDocument, IQueryReaction } from '@feature/reactions/interfaces/reactions.interface'
import { UserCache } from '../redis/user.cache'
import { ReactionModel } from '@/feature/reactions/models/reactions.model'
import { PostModel } from '@/feature/posts/models/post.schema'
import { Helpers } from '@/shared/global/helpers/helper'
import { INotificationDocument, INotificationTemplate } from '@feature/notification/interfaces/notification.interface'
import { NotificationModel } from '@/feature/notification/models/notification.schema'
import { IUserDocument } from '@feature/user/interfaces/user.interface'
import { IPostDocument } from '@feature/posts/interfaces/post.interface'
import { socketIONotificationObject } from '@/shared/sockets/notification'
import { notificationTemplate } from '../email/templates/notifications/notification.template'
import { mailQueue } from '../queues/email.queue'

const userCache: UserCache = new UserCache()

class ReactionService {
  public async addReactionDataToDB(reaction: IReactionJob): Promise<void> {
    //userFrom =>currentUser
    const { postId, userTo, userFrom, username, previousReaction, reactionObject } = reaction

    const updateReactions: [IUserDocument, IReactionDocument, IPostDocument] = (await Promise.all([
      userCache.getUserFromCache(`${userTo}`),
      //upsert 找到就更新 没有就创建
      ReactionModel.replaceOne({ postId, type: previousReaction, username }, reactionObject, { upsert: true }),
      PostModel.findByIdAndUpdate(
        { _id: postId },
        {
          $inc: {
            [`reactions.${reactionObject?.type}`]: 1,
            [`reactions.${previousReaction}`]: -1
          }
        },
        {
          $new: true
        }
      )
    ])) as unknown as [IUserDocument, IReactionDocument, IPostDocument]

    if (updateReactions[0]?.notifications.reactions && userTo !== userFrom) {
      const notificationModel: INotificationDocument = new NotificationModel()
      const notifications = await notificationModel.insertNotification({
        userFrom: userFrom as string,
        userTo: userTo as string,
        message: `${username} reacted to your post.`,
        notificationType: 'reactions',
        entityId: new mongoose.Types.ObjectId(postId),
        createdItemId: new mongoose.Types.ObjectId(updateReactions[1]._id!),
        createdAt: new Date(),
        comment: '',
        post: updateReactions[2]?.post!,
        imgId: updateReactions[2]?.imgId!,
        imgVersion: updateReactions[2]?.imgVersion!,
        gifUrl: updateReactions[2]?.gifUrl!,
        reaction: reactionObject?.type!
      })

      socketIONotificationObject.emit('insert notification', notifications, { userTo })

      const templateParams: INotificationTemplate = {
        username: updateReactions[0].username!,
        message: `${username} 对该条动态添加了心情.`,
        header: '新心情发布提醒'
      }
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams)
      mailQueue.addEmailJob('reactionsEmail', {
        receiverEmail: updateReactions[0].email!,
        template,
        subject: '新心情发布提醒'
      })
    }
  }

  public async removeReactionDataFromDB(reactionData: IReactionJob): Promise<void> {
    const { postId, previousReaction, username } = reactionData
    await Promise.all([
      ReactionModel.deleteOne({ postId, type: previousReaction, username }),
      PostModel.updateOne(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1
          }
        },
        {
          $new: true
        }
      )
    ])
  }

  //获取post对应的所有reaction
  //sort createdAt排序
  public async getPostReactions(query: IQueryReaction, sort: Record<string, 1 | -1>): Promise<[IReactionDocument[], number]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([{ $match: query }, { $sort: sort }])
    return [reactions, reactions.length]
  }

  public async getSinglePostReactionByUsername(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), username: Helpers.firstLetterToUppercase(username) } }
    ])
    return reactions.length ? [reactions[0], 1] : []
  }

  public async getReactionsByUsername(username: string): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { username: Helpers.firstLetterToUppercase(username) } }
    ])
    return reactions
  }
}

export const reactionService: ReactionService = new ReactionService()