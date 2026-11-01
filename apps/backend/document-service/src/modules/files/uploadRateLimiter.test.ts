import { HttpException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { UploadRateLimiter } from './uploadRateLimiter.js';

const MB = 1024 * 1024;

describe('UploadRateLimiter', () => {
  it('allows a burst up to the per-minute request cap, then rejects', () => {
    const limiter = new UploadRateLimiter();

    for (let index = 0; index < 20; index += 1) {
      limiter.consume('user-1', 1);
    }

    expect(() => limiter.consume('user-1', 1)).toThrow(HttpException);
  });

  it('rejects when the byte budget is exceeded', () => {
    const limiter = new UploadRateLimiter();

    expect(() => limiter.consume('user-1', 101 * MB)).toThrow(HttpException);
  });

  it('tracks users independently', () => {
    const limiter = new UploadRateLimiter();

    for (let index = 0; index < 20; index += 1) {
      limiter.consume('user-1', 1);
    }

    expect(() => limiter.consume('user-2', 1)).not.toThrow();
  });
});
