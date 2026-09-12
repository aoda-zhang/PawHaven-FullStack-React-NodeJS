import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ThrottleConfig } from './gateway-throttle';

const MINIMUM_THROTTLE_VALUE = 1;
const THROTTLE_KEYS: Array<keyof ThrottleConfig> = [
  'ttlMs',
  'limit',
  'authTtlMs',
  'authLimit',
];

@Injectable()
export class ThrottleConfigValidator {
  constructor(configService: ConfigService) {
    const throttle = configService.getOrThrow<ThrottleConfig>('throttle');
    THROTTLE_KEYS.forEach((key) => {
      if (
        typeof throttle[key] !== 'number' ||
        throttle[key] < MINIMUM_THROTTLE_VALUE
      ) {
        throw new Error(
          `throttle.${key} must be a number >= ${MINIMUM_THROTTLE_VALUE}`,
        );
      }
    });
  }
}
