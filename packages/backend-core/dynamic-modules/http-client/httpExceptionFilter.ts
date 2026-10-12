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

import { httpHeaders } from '../../constants/httpHeaders.js';
import { getTraceId } from '../../trace/traceContext.js';
import { HttpResType } from '../../types/Http.types.js';

import { mapPrismaError } from './prismaError.js';

const BUSINESS_CODES = new Set<string>(Object.values(httpBusinessMappingCodes));

/**
 * Reads a trace id off an exception payload.
 *
 * Only the object form is considered. `HttpException` returns its response
 * verbatim, and `new HttpException('some message', 400)` therefore yields the
 * bare string — accepting a string here would copy the error message straight
 * into the `traceId` field.
 */
const readTraceId = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object' || !('traceId' in value)) {
    return undefined;
  }

  const candidate = (value as { traceId?: unknown }).traceId;
  return typeof candidate === 'string' && candidate.length > 0
    ? candidate
    : undefined;
};

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctxType = host.getType();

    let message = 'Service error';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let data = null;
    // A downstream `HttpClientInstance` attaches the trace id of the failed
    // call to the exception payload. Prefer it over the ambient id so the caller
    // is pointed at the hop that actually broke, not at the hop that noticed.
    let traceId = getTraceId();

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
      traceId = readTraceId(res) ?? traceId;
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
      ...(traceId ? { traceId } : {}),
    };

    this.logger.error(
      `Exception caught (context: ${ctxType}):`,
      JSON.stringify(errorResponse),
    );

    if (ctxType === 'http') {
      const response = host.switchToHttp().getResponse();
      // `setHeader` rather than a header on `.json()`: the trace middleware has
      // normally set this already, and repeating it keeps the header present
      // even where that middleware was bypassed.
      if (traceId && typeof response.setHeader === 'function') {
        response.setHeader(httpHeaders.traceId, traceId);
      }
      response.status(status).json(errorResponse);
      return;
    }

    if (ctxType === 'rpc') {
      host.switchToRpc().getContext()?.emit?.('error', errorResponse);
    }
  }
}
