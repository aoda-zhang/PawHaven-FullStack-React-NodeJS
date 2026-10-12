import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { httpHeaders } from '../constants/httpHeaders.js';
import { readHeader } from '../utils/readHeader.js';

import { getTraceId } from './traceContext.js';

/**
 * Injects the ambient trace id into a handler.
 *
 * Prefer reading the id from the ambient store (or letting
 * `TraceLogger` stamp it on every log line) over threading it through
 * signatures; this decorator exists for the cases where a handler has to hand
 * the id to something that logs outside the request scope.
 */
export const TraceId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    return (
      getTraceId() ?? readHeader(request?.headers ?? {}, httpHeaders.traceId)
    );
  },
);
