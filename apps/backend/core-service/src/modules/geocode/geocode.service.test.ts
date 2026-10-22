import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '@pawhaven/backend-core';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

import { GeocodeService } from './geocode.service.js';

const geocodeConfig = {
  url: 'https://nominatim.example/reverse',
  userAgent: 'PawHaven/1.0',
  timeoutMs: 5000,
};

type GetMock = ReturnType<typeof vi.fn>;

const makeService = (get: GetMock) => {
  const httpClientService = {
    create: vi.fn(() => ({ get })),
  } as unknown as HttpClientService;
  const config = {
    getOrThrow: (_key: string) => geocodeConfig,
  } as unknown as ConfigService;

  return new GeocodeService(httpClientService, config);
};

describe('GeocodeService', () => {
  let get: GetMock;

  beforeEach(() => {
    get = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the display name from the upstream response', async () => {
    get.mockResolvedValue({
      display_name: 'Central Park, New York, United States',
    });

    await expect(
      makeService(get).reverse({ lat: '40.7', lon: '-73.9', lang: 'en' }),
    ).resolves.toEqual({
      address: 'Central Park, New York, United States',
    });
  });

  it('builds an address from components when display_name is missing', async () => {
    get.mockResolvedValue({
      address: { road: 'Main Street', city: 'Springfield', country: 'US' },
    });

    await expect(
      makeService(get).reverse({ lat: '40.7', lon: '-73.9' }),
    ).resolves.toEqual({
      address: 'Main Street, Springfield, US',
    });
  });

  it('sends the configured endpoint, user agent and timeout', async () => {
    get.mockResolvedValue({ display_name: 'Somewhere' });

    await makeService(get).reverse({
      lat: '40.7',
      lon: '-73.9',
      lang: 'zh-CN',
    });

    expect(get).toHaveBeenCalledWith(geocodeConfig.url, {
      config: {
        params: {
          format: 'json',
          lat: 40.7,
          lon: -73.9,
          'accept-language': 'zh-CN',
        },
        headers: { 'User-Agent': 'PawHaven/1.0', Accept: 'application/json' },
        timeout: geocodeConfig.timeoutMs,
      },
    });
  });

  it('rejects coordinates outside the valid range before calling upstream', async () => {
    await expect(
      makeService(get).reverse({ lat: '200', lon: '0' }),
    ).rejects.toThrow(BadRequestException);
    expect(get).not.toHaveBeenCalled();
  });

  it('propagates the upstream failure', async () => {
    get.mockRejectedValue(new ServiceUnavailableException('unavailable'));

    await expect(
      makeService(get).reverse({ lat: '40.7', lon: '-73.9' }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
