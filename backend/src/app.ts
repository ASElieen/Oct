import express, { Express } from "express"

import { AppServer } from "./setupServer"

class ApplicationEntry {
  public initialize(): void {
    const app: Express = express()
    const server: AppServer = new AppServer(app)
    server.start()
  }
}

const application: ApplicationEntry = new ApplicationEntry()
application.initialize()
