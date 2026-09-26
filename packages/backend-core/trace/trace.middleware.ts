import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { httpHeaders } from '../constants/httpHeaders.js';

import { resolveInboundTraceId, runWithTrace } from './traceContext.js';

const logger = new Logger('HttpAccess');

const SERVER_ERROR_STATUS = 500;
const CLIENT_ERROR_STATUS = 400;

/**
 * Establishes the trace id for the request and makes it ambient.
 *
 * Registered as plain Express middleware (not a Nest `MiddlewareModule`) so a
 * single registration in `configureApp` covers every service, and so it runs
 * before body parsing — a request rejected by the body parser still gets an id.
 *
 * The id is written to the response header here rather than only in the proxy
 * so that responses produced by Nest itself (401 from the gateway identity
 * resolver, 429 from the throttle guard, 404/400 from proxy path validation,
 * `/health`) are traceable too. `res.setHeader` composes with the later
 * `res.writeHead(status, headers)` on the proxy error path, so the header is not
 * clobbered there.
 */
export const traceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const traceId = resolveInboundTraceId(req.headers);

  // Normalising the request header (rather than only the response one) is what
  // lets the gateway proxy and `HttpClientInstance` pick the id up instead of
  // minting their own, so the whole hop chain agrees on one value.
  // eslint-disable-next-line no-param-reassign
  req.headers[httpHeaders.traceId] = traceId;
  res.setHeader(httpHeaders.traceId, traceId);

  const startedAt = Date.now();

  runWithTrace(traceId, () => {
    res.on('finish', () => {
      // Read the closure rather than the ambient store: the `finish` event is
      // emitted by the HTTP internals, and relying on async-context propagation
      // into that emit would make the access log depend on how the response
      // happened to be written.
      const durationMs = Date.now() - startedAt;
      const line = `${req.method} ${req.path} ${res.statusCode} ${durationMs}ms trace=${traceId}`;

      if (res.statusCode >= SERVER_ERROR_STATUS) {
        logger.error(line);
      } else if (res.statusCode >= CLIENT_ERROR_STATUS) {
        logger.warn(line);
      } else {
        logger.log(line);
      }
    });

    next();
  });
};
