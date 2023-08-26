import express, { Express } from 'express'

import { AppServer } from './setupServer'
import databaseConnection from './setupDatabase'
import { config } from './config'

class ApplicationEntry {
  //入口
  public initialize(): void {
    this.loadConfig()
    databaseConnection()
    const app: Express = express()
    const server: AppServer = new AppServer(app)
    server.start()
  }

  //校验ENV
  private loadConfig(): void {
    config.validateConfig()
  }
}

const application: ApplicationEntry = new ApplicationEntry()
application.initialize()
