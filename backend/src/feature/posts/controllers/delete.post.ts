import { Request, Response } from 'express'
import HTTP_STATUS from 'http-status-codes'

import { PostCache } from '@/shared/services/redis/post.cache'
import { postQueue } from '@/shared/services/queues/post.queue'
import { socketIOPostObject } from '@/shared/sockets/post'

const postCache: PostCache = new PostCache()

export class DeletePost {
  public async delete(req: Request, resp: Response): Promise<void> {
    socketIOPostObject.emit('delete', req.params.postId)
    await postCache.deletePostFromCache(req.params.postId, `${req.currentUser!.userId}`)
    postQueue.addPostJob('deletePostFromDB', { keyOne: req.params.postId, keyTwo: req.currentUser!.userId })

    resp.status(HTTP_STATUS.OK).json({ message: '删除成功' })
  }
}
