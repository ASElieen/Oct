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
}

export const authService: AuthService = new AuthService()