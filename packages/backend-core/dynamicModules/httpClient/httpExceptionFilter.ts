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

import { HttpResType } from '../../types/http.types.js';

const BUSINESS_CODES = new Set<string>(Object.values(httpBusinessMappingCodes));

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const isRpcContext = host.getType() === 'rpc';
    const isHttpContext = host.getType() === 'http';

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
      message = exception?.message ?? message;
      status = exception?.status ?? status;
      data = exception?.data ?? null;
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
      `Exception caught (context: ${host.getType()}):`,
      JSON.stringify(errorResponse),
    );

    if (isHttpContext) {
      const response = host.switchToHttp().getResponse();
      response.status(status).json(errorResponse);
      return;
    }

    if (isRpcContext) {
      // RPC context: emit or log but do NOT return (ESLint: no-return)
      host.switchToRpc().getContext()?.emit?.('error', errorResponse);
    }
  }
}
