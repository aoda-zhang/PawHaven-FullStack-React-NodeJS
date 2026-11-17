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

import { httpHeaders } from '../../common/constants/httpHeaders.js';
import { getTraceId } from '../../infrastructure/observability/tracing/traceContext.js';
import {
  createHttpErrorResponse,
  type HttpResType,
} from '../../common/types/Http.types.js';

import { mapPrismaError } from './prismaError.js';

const BUSINESS_CODES = new Set<string>(Object.values(httpBusinessMappingCodes));

interface ExceptionDetails {
  message: string;
  status: number;
  data: unknown;
  traceId: string | undefined;
}

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
    const details = this.resolveException(exception, ctxType, getTraceId());
    const code = BUSINESS_CODES.has(details.message) ? details.message : '';

    const errorResponse: HttpResType = createHttpErrorResponse(
      details.status,
      details.message,
      code,
      details.data,
      details.traceId,
    );

    this.logger.error(
      `Exception caught (context: ${ctxType}):`,
      JSON.stringify(errorResponse),
    );

    this.sendResponse(
      host,
      ctxType,
      details.status,
      errorResponse,
      details.traceId,
    );
  }

  private resolveException(
    exception: unknown,
    ctxType: string,
    traceId: string | undefined,
  ): ExceptionDetails {
    return exception instanceof HttpException
      ? this.resolveHttpException(exception, traceId)
      : this.resolveUnexpectedException(exception, ctxType, traceId);
  }

  private resolveHttpException(
    exception: HttpException,
    traceId: string | undefined,
  ): ExceptionDetails {
    const res = exception.getResponse();
    const message =
      typeof res === 'string'
        ? res
        : (res as any)?.message || exception.message;
    const status =
      typeof res === 'object' && 'status' in res
        ? (res as any).status || exception.getStatus()
        : exception.getStatus();
    const data = typeof res === 'object' ? (res as any).data || null : null;

    return { message, status, data, traceId: readTraceId(res) ?? traceId };
  }

  private resolveUnexpectedException(
    exception: unknown,
    ctxType: string,
    traceId: string | undefined,
  ): ExceptionDetails {
    const prisma = mapPrismaError(exception);

    if (prisma) {
      this.logFailure(`Prisma error (status ${prisma.status}):`, exception);

      return {
        message: prisma.message,
        status: prisma.status,
        data: null,
        traceId,
      };
    }

    this.logFailure(`Unexpected error in ${ctxType} context:`, exception);

    return {
      message: 'Internal server error',
      status:
        (exception as { status?: number } | null)?.status ??
        HttpStatus.INTERNAL_SERVER_ERROR,
      data: null,
      traceId,
    };
  }

  private logFailure(label: string, exception: unknown): void {
    this.logger.error(
      label,
      exception instanceof Error
        ? (exception.stack ?? exception.message)
        : exception,
    );
  }

  private sendResponse(
    host: ArgumentsHost,
    ctxType: string,
    status: number,
    errorResponse: HttpResType,
    traceId: string | undefined,
  ): void {
    if (ctxType === 'http') {
      const response = host.switchToHttp().getResponse();
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
