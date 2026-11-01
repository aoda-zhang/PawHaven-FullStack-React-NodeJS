import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_BYTES = 100 * 1024 * 1024;
const MAX_TRACKED_USERS = 10_000;

type Window = {
  requests: number;
  bytes: number;
  resetAt: number;
};

/**
 * Per-user upload throttle held in process memory, mirroring the gateway's
 * bucket throttle. It caps each authenticated caller per window; it is not
 * shared across replicas, so a multi-pod deployment enforces the limit per pod.
 */
@Injectable()
export class UploadRateLimiter {
  private readonly windows = new Map<string, Window>();

  consume(userId: string, bytes: number): void {
    const now = Date.now();
    const current = this.windows.get(userId);
    const next: Window =
      current && current.resetAt > now
        ? {
            requests: current.requests + 1,
            bytes: current.bytes + bytes,
            resetAt: current.resetAt,
          }
        : { requests: 1, bytes, resetAt: now + WINDOW_MS };

    if (next.requests > MAX_REQUESTS || next.bytes > MAX_BYTES) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!current || current.resetAt <= now) {
      this.sweep(now);
    }
    this.windows.set(userId, next);
  }

  private sweep(now: number): void {
    if (this.windows.size < MAX_TRACKED_USERS) {
      return;
    }
    this.windows.forEach((window, key) => {
      if (window.resetAt <= now) {
        this.windows.delete(key);
      }
    });
  }
}
