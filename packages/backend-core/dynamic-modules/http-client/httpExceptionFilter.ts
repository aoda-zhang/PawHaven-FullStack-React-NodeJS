import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { httpBusinessMappingCodes } from '@pawhaven/shared';

import { HttpResType } from '../../types/Http.types.js';

import { mapPrismaError } from './prismaError.js';

const BUSINESS_CODES = new Set<string>(Object.values(httpBusinessMappingCodes));

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctxType = host.getType();

    let message = 'Service error';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let data = null;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : (res as any)?.message || exception.message;
      status =
        typeof res === 'object' && 'status' in res
          ? (res as any).status || exception.getStatus()
          : exception.getStatus();
      data = typeof res === 'object' ? (res as any).data || null : null;
    } else {
      const prisma = mapPrismaError(exception);

      if (prisma) {
        this.logger.error(
          `Prisma error (status ${prisma.status}):`,
          exception instanceof Error
            ? (exception.stack ?? exception.message)
            : exception,
        );
        message = prisma.message;
        status = prisma.status;
        data = null;
      } else {
        this.logger.error(
          `Unexpected error in ${ctxType} context:`,
          exception instanceof Error
            ? (exception.stack ?? exception.message)
            : exception,
        );
        message = 'Internal server error';
        status = exception?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
        data = null;
      }
    }

    const code = BUSINESS_CODES.has(message) ? message : '';

    const errorResponse: HttpResType = {
      status,
      isSuccess: false,
      message,
      code,
      data,
    };

    this.logger.error(
      `Exception caught (context: ${ctxType}):`,
      JSON.stringify(errorResponse),
    );

    if (ctxType === 'http') {
      const response = host.switchToHttp().getResponse();
      response.status(status).json(errorResponse);
      return;
    }

    if (ctxType === 'rpc') {
      host.switchToRpc().getContext()?.emit?.('error', errorResponse);
    }
  }
}
