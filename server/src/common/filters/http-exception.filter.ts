import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    // Log 500 errors
    if (status >= 500) {
      this.logger.error(
        `Internal server error: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : undefined,
      )
    }

    // Handle class-validator validation errors (message is an array)
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>
      if (Array.isArray(resp.message)) {
        response.status(status).json({
          success: false,
          error: resp.message[0],
          errors: resp.message,
          statusCode: status,
        })
        return
      }
    }

    response.status(status).json({
      success: false,
      error: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as Record<string, unknown>).message || exceptionResponse,
      statusCode: status,
    })
  }
}
