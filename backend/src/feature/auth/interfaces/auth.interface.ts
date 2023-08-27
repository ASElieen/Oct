import { Document } from 'mongoose'
import { ObjectId } from 'mongodb'

//declare不需要引用可以直接使用
declare global {
  namespace Express {
    interface Request {
      //未登录则undefined
      currentUser?: AuthPayload
    }
  }
}

export interface AuthPayload {
  userId: string
  uId: string
  email: string
  username: string
  avatarColor: string
  iat?: number
}

export interface IAuthDocument extends Document {
  _id: string | ObjectId
  uId: string
  username: string
  email: string
  password?: string
  avatarColor: string
  createdAt: Date
  passwordResetToken?: string
  passwordResetExpires?: number | string
  comparePassword(password: string): Promise<boolean>
  hashPassword(password: string): Promise<string>
}

export interface ISignUpData {
  _id: ObjectId
  uId: string
  email: string
  username: string
  password: string
  avatarColor: string
}

export interface IAuthJob {
  value?: string | IAuthDocument
}
