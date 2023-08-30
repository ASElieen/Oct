import mongoose, { Document } from 'mongoose'
import { ObjectId } from 'mongodb'

export interface IUserDocument extends Document {
  _id: string | ObjectId //mongodb _id
  authId: string | ObjectId //signup中通过objectId生成的authId
  //该部分为auth部分 存redis
  username?: string
  email?: string
  password?: string
  avatarColor?: string
  uId?: string

  postsCount: number
  work: string
  school: string
  quote: string
  location: string
  //黑名单
  blocked: mongoose.Types.ObjectId[]
  blockedBy: mongoose.Types.ObjectId[]

  followersCount: number
  followingCount: number
  notifications: INotificationSettings
  social: ISocialLinks
  bgImageVersion: string
  bgImageId: string
  profilePicture: string
  createdAt?: Date
}

export interface IResetPasswordParams {
  username: string
  email: string
  ipaddress: string
  date: string
}

export interface INotificationSettings {
  messages: boolean
  reactions: boolean
  comments: boolean
  follows: boolean
}

export interface IBasicInfo {
  quote: string
  work: string
  school: string
  location: string
}

export interface ISocialLinks {
  facebook: string
  instagram: string
  twitter: string
  youtube: string
}

export interface ISearchUser {
  _id: string
  profilePicture: string
  username: string
  email: string
  avatarColor: string
}

export interface ISocketData {
  blockedUser: string
  blockedBy: string
}

export interface ILogin {
  userId: string
}

export interface IUserJobInfo {
  key?: string
  value?: string | ISocialLinks
}

export interface IUserJob {
  keyOne?: string
  keyTwo?: string
  key?: string
  value?: string | INotificationSettings | IUserDocument
}

export interface IEmailJob {
  receiverEmail: string
  template: string
  subject: string
}

export interface IAllUsers {
  users: IUserDocument[]
  totalUsers: number
}
