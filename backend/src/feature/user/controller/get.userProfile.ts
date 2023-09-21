import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import mongoose from 'mongoose'

import { Helpers } from '@/shared/global/helpers/helper'
import { UserCache } from '@/shared/services/redis/user.cache'
import { FollowAndBlockCache } from '@/shared/services/redis/follow&block.cache'
import { IUserDocument } from '../interfaces/user.interface'
import { userService } from '@/shared/services/db/user.service'
import { followerService } from '@/shared/services/db/follower.service'
import { IFollowerData } from '../../follow&block/interfaces/follow.block.interface'
import { IAllUsers } from '../interfaces/user.interface'
import { PostCache } from '@shared/services/redis/post.cache'
import { postService } from '@shared/services/db/post.service'
import { IPostDocument } from '../../posts/interfaces/post.interface'

interface IUserAll {
  newSkip: number
  limit: number
  skip: number
  userId: string
}

const PAGE_SIZE = 12
const userCache: UserCache = new UserCache()
const followAndBlockCache: FollowAndBlockCache = new FollowAndBlockCache()
const postCache: PostCache = new PostCache()

export class GetUsers {
  public async all(req: Request, res: Response): Promise<void> {
    const { page } = req.params
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE
    const limit: number = PAGE_SIZE * parseInt(page)
    const newSkip: number = skip === 0 ? skip : skip + 1

    const allUsers = await GetUsers.prototype.allUsers({
      newSkip,
      limit,
      skip,
      userId: `${req.currentUser!.userId}`
    })

    const followers: IFollowerData[] = await GetUsers.prototype.followers(`${req.currentUser!.userId}`)

    res
      .status(HTTP_STATUS.OK)
      .json({ message: '获取users profile数据成功', users: allUsers.users, totalUsers: allUsers.totalUsers, followers })
  }

  private async allUsers({ newSkip, limit, skip, userId }: IUserAll): Promise<IAllUsers> {
    let users
    let type = ''
    const cachedUsers: IUserDocument[] = (await userCache.getUsersFromCacheWithPagnation(
      newSkip,
      limit,
      userId
    )) as IUserDocument[]
    if (cachedUsers.length) {
      type = 'redis'
      users = cachedUsers
    } else {
      type = 'mongodb'
      users = await userService.getAllUsersWithPagnation(userId, skip, limit)
    }
    const totalUsers: number = await GetUsers.prototype.usersCount(type)
    return { users, totalUsers }
  }

  public async currentUserProfile(req: Request, resp: Response): Promise<void> {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserByMongoId(`${req.currentUser!.userId}`)
    resp.status(HTTP_STATUS.OK).json({ message: '获取当前用户信息成功', user: existingUser })
  }

  public async profileByUserId(req: Request, res: Response): Promise<void> {
    const { userId } = req.params
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(userId)) as IUserDocument
    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserByMongoId(userId)
    res.status(HTTP_STATUS.OK).json({ message: '通过id获取其他用户信息成功', user: existingUser })
  }

  public async profileAndPosts(req: Request, resp: Response): Promise<void> {
    const { userId, username, uId } = req.params
    const userName: string = Helpers.firstLetterToUppercase(username)
    const cachedUser = await userCache.getUserFromCache(userId)
    const cachedUserPosts = await postCache.getUserPostFromCache('post', parseInt(uId, 10))

    const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserByMongoId(userId)
    const userPosts: IPostDocument[] = cachedUserPosts.length
      ? cachedUserPosts
      : await postService.getPosts({ username: userName }, 0, 100, { createdAt: -1 })

    resp.status(HTTP_STATUS.OK).json({ message: '成功获取到用户信息及其发布内容', user: existingUser, posts: userPosts })
  }

  public async randomUserSuggestions(req: Request, resp: Response): Promise<void> {
    let randomUsers: IUserDocument[] = []
    const cachedUsers: IUserDocument[] = await userCache.getRandomUserFromCache(
      `${req.currentUser!.userId}`,
      req.currentUser!.username
    )

    if (cachedUsers.length) {
      randomUsers = [...cachedUsers]
    } else {
      const users: IUserDocument[] = await userService.getRandomUsers(req.currentUser!.userId)
      randomUsers = [...users]
    }

    resp.status(HTTP_STATUS.OK).json({ message: '获取陌生用户推荐数据成功', users: randomUsers })
  }

  private async usersCount(type: string): Promise<number> {
    const totalUsers: number = type === 'redis' ? await userCache.getTotalUsersInCache() : await userService.getTotalUsersInDB()
    return totalUsers
  }

  private async followers(userId: string): Promise<IFollowerData[]> {
    const cachedFollowers: IFollowerData[] = await followAndBlockCache.getFollowersFromCache(`followers:${userId}`)
    const result = cachedFollowers.length
      ? cachedFollowers
      : await followerService.getFollowerDataInDB(new mongoose.Types.ObjectId(userId))
    return result
  }
}