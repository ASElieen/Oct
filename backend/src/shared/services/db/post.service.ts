import { UpdateQuery } from 'mongoose'

import { IPostDocument, IGetPostsQuery } from '@feature/posts/interfaces/post.interface'
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

  public async getPosts(query: IGetPostsQuery, skip = 0, limit = 0, sort: Record<string, 1 | -1>): Promise<IPostDocument[]> {
    let postQuery = {}
    if (query.imgId && query?.gifUrl) {
      postQuery = { $or: [{ imgId: { $ne: '' } }, { gifUrl: { $ne: '' } }] }
    } else {
      postQuery = query
    }

    const posts = await PostModel.aggregate([
      { $match: postQuery },
      { $sort: sort },
      //pagnation
      { $skip: skip },
      { $limit: limit }
    ])
    return posts
  }

  public async postsCount(): Promise<number> {
    //find({})表示计算总数
    const count = await PostModel.find({}).countDocuments()
    return count
  }
}

export const postService: PostService = new PostService()