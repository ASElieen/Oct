import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'
import { IPostDocument } from '../interfaces/post.interface'
import { PostCache } from '@/shared/services/redis/post.cache'
import { postService } from '@shared/services/db/post.service'

const postCache: PostCache = new PostCache()
const PAGE_SIZE = 10

export class GetPost {
  public async getAllposts(req: Request, resp: Response): Promise<void> {
    const { page } = req.params
    //跳过前多少条数据 mongodb
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE
    //Limit返回的总数据条数
    const limit: number = PAGE_SIZE * parseInt(page)
    //redis
    const start: number = skip === 0 ? skip : skip + 1
    let posts: IPostDocument[] = []
    let totalPosts = 0
    const cachePosts: IPostDocument[] = await postCache.getPostFromCache('post', start, limit)

    if (cachePosts.length) {
      posts = cachePosts
      totalPosts = await postCache.getTotalPostsInCache()
    } else {
      posts = await postService.getPosts({}, skip, limit, { createdAt: -1 })
      totalPosts = await postService.postsCount()
    }

    resp.status(HTTP_STATUS.OK).json({ message: 'All posts', posts, totalPosts })
  }

  public async getAllpostsWithImages(req: Request, resp: Response): Promise<void> {
    const { page } = req.params
    //跳过前多少条数据 mongodb
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE
    //Limit返回的总数据条数
    const limit: number = PAGE_SIZE * parseInt(page)
    //redis
    const start: number = skip === 0 ? skip : skip + 1
    let posts: IPostDocument[] = []
    const cachePosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache('post', start, limit)

    posts = cachePosts.length
      ? cachePosts
      : await postService.getPosts({ imgId: '$ne', gifUrl: '$ne' }, skip, limit, { createdAt: -1 })

    resp.status(HTTP_STATUS.OK).json({ message: 'All posts with images', posts })
  }

  public async getPostsWithVideos(req: Request, res: Response): Promise<void> {
    const { page } = req.params
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE
    const limit: number = PAGE_SIZE * parseInt(page)
    const newSkip: number = skip === 0 ? skip : skip + 1
    let posts: IPostDocument[] = []
    const cachedPosts: IPostDocument[] = await postCache.getPostsWithVideosFromCache('post', newSkip, limit)
    posts = cachedPosts.length ? cachedPosts : await postService.getPosts({ videoId: '$ne' }, skip, limit, { createdAt: -1 })
    res.status(HTTP_STATUS.OK).json({ message: 'All posts with videos', posts })
  }
}