import { JoiRequestValidationError } from '@shared/global/helpers/errorHandler'
import { Request } from 'express'
import { ObjectSchema } from 'joi'

type IJoiDecorator = (target: any, key: string, descriptor: PropertyDescriptor) => void

export const joiValidation = (schema: ObjectSchema): IJoiDecorator => {
  //_表示该参数只占位
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    //获取需要被装饰的方法
    const originalMethod = descriptor.value

    descriptor.value = async (...args: any[]) => {
      //..args => (req,res,next)  args[0]即为req
      const req: Request = args[0]
      //https://joi.dev/api/?v=17.9.1
      const { error } = await Promise.resolve(schema.validate(req.body))
      if (error?.details) {
        //details[0]拿到的是scheme中的string.base信息
        throw new JoiRequestValidationError(error.details[0].message)
      }
      //参数绑给修饰方法
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}