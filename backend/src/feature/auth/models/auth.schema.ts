import { hash, compare } from 'bcryptjs'
import { IAuthDocument } from '@feature/auth/interfaces/auth.interface'
import { model, Model, Schema } from 'mongoose'

const SALT_ROUND = 10

const authSchema: Schema = new Schema(
  {
    username: { type: String },
    uId: { type: String },
    email: { type: String },
    password: { type: String },
    avatarColor: { type: String },
    createdAt: { type: Date, default: Date.now },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpires: { type: Number }
  },
  {
    toJSON: {
      //删掉密码 只保留剩余属性
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.password
        return ret
      }
    }
  }
)

// hash password 第一次存入密码时使用
authSchema.pre('save', async function (this: IAuthDocument, next: () => void) {
  const hashedPassword: string = await hash(this.password as string, SALT_ROUND)
  this.password = hashedPassword
  next()
})

//用户输入的密码和数据库中的密码进行比对
authSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  const hashedPassword: string = (this as unknown as IAuthDocument).password!
  return compare(password, hashedPassword)
}

//更改密码或者类似场景使用
authSchema.methods.hashPassword = async function (password: string): Promise<string> {
  return hash(password, SALT_ROUND)
}

// Auth为mongodb中生成的collection名
const AuthModel: Model<IAuthDocument> = model<IAuthDocument>('Auth', authSchema, 'Auth')
export { AuthModel }
