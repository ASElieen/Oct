import { IFileImageJobData } from '@/feature/images/interfaces/image.interface'
import { BaseQueue } from './base.queue'
import { imageWorker } from '@/shared/workers/image.worker'

class ImageQueue extends BaseQueue {
  constructor() {
    super('images')
    this.processJob('addUserProfileImageToDB', 5, imageWorker.addUserProfileToDB)
    this.processJob('updateBGImageInDB', 5, imageWorker.updateBGImageInDB)
    this.processJob('addImageToDB', 5, imageWorker.addImageToDB)
    this.processJob('removeImageFromDB', 5, imageWorker.removeImageFromDB)
  }

  public addImageJob(name: string, data: IFileImageJobData): void {
    this.addJob(name, data)
  }
}

export const imageQueue: ImageQueue = new ImageQueue()