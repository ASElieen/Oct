import {
  Application,
  json,
  urlencoded,
  Response,
  Request,
  NextFunction,
} from "express"
import { Server as HttpServer } from "http"
import cors from "cors"
import helmet from "helmet"
import hpp from "hpp"
import compression from "compression"
import cookieSession from "cookie-session"
import HTTP_STATUS from "http-status-codes"
import "express-async-errors"

export class AppServer {
  private app: Application

  constructor(app: Application) {
    this.app = app
  }

  public start(): void {
    this.securityMiddleware(this.app)
    this.standardMiddleware(this.app)
    this.routesMiddleware(this.app)
    this.globalErrorHandler(this.app)
    this.startServer(this.app)
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: "session",
        keys: ["test1", "test2"],
        maxAge: 24 * 7 * 360000,
      })
    )

    app.use(hpp())
    app.use(helmet())

    app.use(
      cors({
        origin: "*",
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      })
    )
  }

  private standardMiddleware(app: Application): void {
    app.use(compression())
    app.use(json({ limit: "50mb" }))
    app.use(urlencoded({ extended: true, limit: "50mb" }))
  }

  private routesMiddleware(app: Application): void {}

  private globalErrorHandler(app: Application): void {}

  private startServer(app: Application): void {}

  private createSocketIO(httpServer: HttpServer): void {}

  private startHttpServer(httpServer: HttpServer): void {}
}
