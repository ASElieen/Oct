import { UpdateQuery } from 'mongoose'

import { IPostDocument } from '@feature/posts/interfaces/post.interface'
import { PostModel } from '@/feature/posts/models/post.schema'
import { IUserDocument } from '@feature/user/interfaces/user.interface'
import { UserModel } from '@/feature/user/models/user.schemal'

class PostService {
  public async addPostsToDB(userId: string, createdPost: IPostDocument): Promise<void> {
    const post: Promise<IPostDocument> = PostModel.create(createdPost)
    //increase
    const user: UpdateQuery<IUserDocument> = UserModel.updateOne({ _id: userId }, { $inc: { postsCount: 1 } })
    await Promise.all([post, user])
  }
}

export const postService: PostService = new PostService()