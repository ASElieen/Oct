import { IAuthDocument } from '@feature/auth/interfaces/auth.interface'
import { AuthModel } from '@/feature/auth/models/auth.schema'
import { Helpers } from '@/shared/global/helpers/helper'

class AuthService {
  //mongodb中通过查询username或者email来获取user
  public async getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: Helpers.firstLetterToUppercase(username) }, { email: Helpers.lowerCase(email) }]
    }

    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument
    return user
  }

  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data)
  }

  //---login part -----
  public async getAuthUserByUsername(username: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      username: Helpers.firstLetterToUppercase(username)
    }).exec()) as IAuthDocument
    return user
  }

  //-------------------forgotpassword-----
  public async getAuthUserByEmail(email: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      email: Helpers.firstLetterToUppercase(email)
    }).exec()) as IAuthDocument
    return user
  }

  public async updatePasswordToken(id: string, token: string, tokenExpiration: number): Promise<void> {
    await AuthModel.updateOne(
      { _id: id },
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration
      }
    )
  }

  //-----------reset password----------
  public async getAuthUserByPasswordToken(token: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      passwordResetToken: token,
      //如果存储的时间依然great than现在的时间则仍然有效
      passwordResetExpires: { $gt: Date.now() }
    }).exec()) as IAuthDocument
    return user
  }
}

export const authService: AuthService = new AuthService()