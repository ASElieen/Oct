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

interface IUserAll {
  newSkip: number
  limit: number
  skip: number
  userId: string
}

const PAGE_SIZE = 12
const userCache: UserCache = new UserCache()
const followAndBlockCache: FollowAndBlockCache = new FollowAndBlockCache()

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