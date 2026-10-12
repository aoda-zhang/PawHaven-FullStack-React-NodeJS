import { inspect } from 'node:util';

import {
  ConsoleLogger,
  type ConsoleLoggerOptions,
  type LoggerService,
  type LogLevel,
} from '@nestjs/common';

import { getTraceId } from '../trace/traceContext.js';

const NO_TRACE_PLACEHOLDER = '-';

/**
 * A `ConsoleLogger` that stamps the ambient trace id onto every line.
 *
 * Routing the whole application through one logger is what makes the trace id
 * useful: there is no call site to remember to annotate, so every existing
 * `new Logger(X).warn(...)` in every service is correlated for free.
 *
 * The id is resolved when the log call happens, not when the line is written.
 * Nest buffers startup logs (`bufferLogs: true` in `bootstrapApp`) and flushes
 * them from `app.listen()`, which runs outside any request — reading the store
 * lazily at write time would attribute those lines to whatever request happened
 * to be in flight.
 */
export class TraceLogger implements LoggerService {
  private readonly delegate: ConsoleLogger;

  constructor(context = '', options: ConsoleLoggerOptions = {}) {
    this.delegate = new ConsoleLogger(context, options);
  }

  private stamp(message: unknown): string {
    const traceId = getTraceId() ?? NO_TRACE_PLACEHOLDER;
    // Non-string messages are inspected rather than coerced: `logger.log(someError)`
    // is common in this codebase, and `String(err)` would flatten it to
    // "[object Object]" and lose the stack.
    return `[trace=${traceId}] ${
      typeof message === 'string' ? message : inspect(message)
    }`;
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.delegate.log(this.stamp(message), ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.delegate.error(this.stamp(message), ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.delegate.warn(this.stamp(message), ...optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.delegate.debug(this.stamp(message), ...optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.delegate.verbose(this.stamp(message), ...optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.delegate.fatal(this.stamp(message), ...optionalParams);
  }

  setLogLevels(levels: LogLevel[]): void {
    this.delegate.setLogLevels(levels);
  }
}
