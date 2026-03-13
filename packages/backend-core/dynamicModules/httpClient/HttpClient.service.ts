import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HttpClientInstance } from './httpClientInstance';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  private readonly clientRegistry = new Map<string, HttpClientInstance>();

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getDefaultHeaders(): Record<string, string> {
    return {
      'X-App-Source': 'nestjs-gateway',
      'X-Env': this.config.get<string>('NODE_ENV') || 'dev',
    };
  }

  create(serviceName: string): HttpClientInstance {
    if (!serviceName) {
      throw new Error('HttpClientService: baseURL is required');
    }

    const cachedClient = this.clientRegistry.get(serviceName);
    if (cachedClient) {
      return cachedClient;
    }

    const defaultHeaders = this.getDefaultHeaders();

    const client = new HttpClientInstance(
      this.httpService,
      this.config,
      serviceName,
      defaultHeaders,
      this.logger,
    );

    this.clientRegistry.set(serviceName, client);

    return client;
  }
}
