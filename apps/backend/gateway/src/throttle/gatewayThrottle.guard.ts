import {
  HttpException,
  HttpStatus,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { isSensitiveAuthPath, type ThrottleConfig } from './gatewayThrottle.js';

type Window = {
  count: number;
  resetAt: number;
};

type Limiter = {
  name: string;
  ttlMs: number;
  limit: number;
};

const MAX_TRACKED_CLIENTS = 10_000;
const TOO_MANY_REQUESTS = 'Too Many Requests';
const UNKNOWN_CLIENT = 'unknown';
const AUTH_LIMITER = 'auth';
@Injectable()
export class GatewayThrottleGuard implements CanActivate {
  private readonly buckets = new Map<string, Window>();

  private readonly limiters: Limiter[];

  constructor(configService: ConfigService) {
    const throttle = configService.getOrThrow<ThrottleConfig>('throttle');
    this.limiters = [
      { name: 'default', ttlMs: throttle.ttlMs, limit: throttle.limit },
      {
        name: AUTH_LIMITER,
        ttlMs: throttle.authTtlMs,
        limit: throttle.authLimit,
      },
    ];
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const client =
      request.ip || request.socket?.remoteAddress || UNKNOWN_CLIENT;
    const isAuthPath = isSensitiveAuthPath(context);

    this.limiters
      .filter((limiter) => limiter.name !== AUTH_LIMITER || isAuthPath)
      .forEach((limiter) => {
        this.consume(`${limiter.name}:${client}`, limiter);
      });

    return true;
  }

  private consume(key: string, limiter: Limiter): void {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.sweep(now);
      this.buckets.set(key, { count: 1, resetAt: now + limiter.ttlMs });
      return;
    }

    current.count += 1;
    if (current.count > limiter.limit) {
      throw new HttpException(TOO_MANY_REQUESTS, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private sweep(now: number): void {
    if (this.buckets.size < MAX_TRACKED_CLIENTS) {
      return;
    }
    this.buckets.forEach((window, key) => {
      if (window.resetAt <= now) {
        this.buckets.delete(key);
      }
    });
  }
}
