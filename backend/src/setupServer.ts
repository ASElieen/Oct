import {
  Application,
  json,
  urlencoded,
  Response,
  Request,
  NextFunction,
} from "express"

import { Server as HttpServer } from "http"
import { Server as SocketServer } from "socket.io"
import { createClient } from "redis"
import { createAdapter } from "@socket.io/redis-adapter"
import appRoutes from "./routes"

import cors from "cors"
import helmet from "helmet"
import hpp from "hpp"
import compression from "compression"
import cookieSession from "cookie-session"
import HTTP_STATUS from "http-status-codes"
import "express-async-errors"

import { config } from "./config"

const SERVER_PORTS = 5000

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

  //安全中间件
  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: "session",
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 360000,
        secure: config.NODE_ENV !== "development",
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

  //标准解析中间件
  private standardMiddleware(app: Application): void {
    app.use(compression())
    app.use(json({ limit: "50mb" }))
    app.use(urlencoded({ extended: true, limit: "50mb" }))
  }

  //路由
  private routesMiddleware(app: Application): void {
    appRoutes(app)
  }

  //全局错误处理
  private globalErrorHandler(app: Application): void {}

  //启动HTTP和Socket
  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: HttpServer = new HttpServer(app)
      const socketIO: SocketServer = await this.createSocketIO(httpServer)
      this.startHttpServer(httpServer)
      this.socketIOConnection(socketIO)
    } catch (error) {
      console.log(error)
    }
  }

  //创建socket服务
  private async createSocketIO(httpServer: HttpServer): Promise<SocketServer> {
    const io: SocketServer = new SocketServer(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      },
    })

    const pubClient = createClient({ url: config.REDIS_HOST })
    const subClient = pubClient.duplicate()

    await Promise.all([pubClient.connect(), subClient.connect()])
    io.adapter(createAdapter(pubClient, subClient))
    return io
  }

  //创建http服务
  private startHttpServer(httpServer: HttpServer): void {
    httpServer.listen(SERVER_PORTS, () => {
      console.log("服务已成功启动")
    })
  }

  //socket链接
  private socketIOConnection(io: SocketServer): void {}
}
