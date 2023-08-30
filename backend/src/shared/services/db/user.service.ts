import { IUserDocument } from '@/feature/user/interfaces/user.interface'
import { UserModel } from '@/feature/user/models/user.schemal'

class UserService {
  public async addUserData(data: IUserDocument): Promise<void> {
    await UserModel.create(data)
  }
}

export const userService: UserService = new UserService()