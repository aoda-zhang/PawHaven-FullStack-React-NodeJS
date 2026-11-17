import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { httpHeaders } from '../../common/constants/httpHeaders.js';
import {
  generateTraceId,
  getTraceId,
} from '../../infrastructure/observability/tracing/traceContext.js';
import { signInternalJwt } from '../internal-jwt/sign.js';
import { InternalJwtKind, type InternalJwt } from '../../common/types/index.js';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete';

interface RequestOptions {
  headers?: Record<string, string>;
  config?: AxiosRequestConfig;
  returnResponse?: boolean;
  /**
   * Overrides the trace id propagated downstream. Defaults to the ambient
   * request trace id so a service-to-service hop stays on the same trace.
   */
  traceId?: string;
}

interface MicroserviceOption {
  host: string;
  port?: number;
}

interface MicroserviceConfigItem {
  name: string;
  enable?: boolean;
  options?: MicroserviceOption;
}

interface RequestContext {
  traceId: string;
  startTime: number;
  method: HttpMethod;
  url: string;
  requestData: unknown;
  isExternal: boolean;
}

export class HttpClientInstance {
  private readonly internalJwtTtlSeconds: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly serviceName: string,
    private readonly defaultHeaders: Record<string, string>,
    private readonly logger: Logger,
  ) {
    this.internalJwtTtlSeconds = this.configService.getOrThrow<number>(
      'internalJwt.ttlSeconds',
    );
  }

  private getCurrentMicroserviceOption(): MicroserviceOption {
    const allMicroservices =
      this.configService.getOrThrow<MicroserviceConfigItem[]>('microServices');
    const currentMicroserviceOption = allMicroservices?.find(
      (mic) => mic?.name === this.serviceName && mic?.enable,
    );

    if (currentMicroserviceOption?.options?.host) {
      return currentMicroserviceOption.options;
    }

    throw new Error(
      `ConfigService: missing microServices ${this.serviceName} config`,
    );
  }

  private resolveServiceOrigin(option: MicroserviceOption): string {
    const host = (
      /^https?:\/\//i.test(option.host) ? option.host : `http://${option.host}`
    ).replace(/\/+$/, '');

    if (
      (host.includes('localhost') || host.includes('127.0.0.1')) &&
      option.port &&
      !/:\d+(?=\/|$)/.test(host)
    ) {
      return `${host}:${option.port}`;
    }

    return host;
  }

  private isExternalTarget(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  private getFullURL(path: string): string {
    const currentMicroserviceOption = this.getCurrentMicroserviceOption();
    const cleanedBase = this.resolveServiceOrigin(currentMicroserviceOption);
    const routePrefix = `/${this.serviceName}`.replace(/\/+$/, '');
    const cleanedPath = path?.trim()?.replace(/^\/+/, '');

    const fullUrl = cleanedPath
      ? `${cleanedBase}${routePrefix}/${cleanedPath}`
      : `${cleanedBase}${routePrefix}`;
    if (!fullUrl) {
      throw new Error(`Invalid composed URL: "${fullUrl}"`);
    }

    return fullUrl;
  }

  private buildRequestConfig(
    context: RequestContext,
    options?: RequestOptions,
  ): AxiosRequestConfig {
    const headers = context.isExternal
      ? {
          ...options?.config?.headers,
          ...options?.headers,
          'Accept-Encoding': 'identity',
        }
      : {
          ...this.defaultHeaders,
          ...this.buildInternalAuthHeaders(options, context.traceId),
          ...options?.config?.headers,
          ...options?.headers,
          [httpHeaders.traceId]: context.traceId,
        };

    return {
      timeout: this.configService.getOrThrow<number>('http.timeout'),
      ...options?.config,
      method: context.method,
      url: context.url,
      headers,
      data: context.requestData,
    };
  }

  private buildInternalAuthHeaders(
    options: RequestOptions | undefined,
    traceId: string,
  ): Record<string, string> {
    if (options?.headers?.[httpHeaders.gatewayJwt]) {
      return {};
    }

    const privateKey = this.configService.get<string>(
      'INTERNAL_JWT_PRIVATE_KEY',
    );
    if (!privateKey) {
      return {};
    }

    const keyId = this.configService.getOrThrow<string>('internalJwt.keyId');
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const claims: InternalJwt = {
      kind: InternalJwtKind.AUTHENTICATED,
      aud: this.serviceName,
      iat: nowInSeconds,
      exp: nowInSeconds + this.internalJwtTtlSeconds,
      // `rid` carries the trace id, so the JWT a callee verifies and the
      // `x-trace-id` header it receives describe the same request. The guard
      // cross-checks the two.
      rid: traceId,
      sub: this.configService.get<string>('serviceName') ?? this.serviceName,
    };
    return signInternalJwt(claims, privateKey, keyId);
  }

  private extractErrorMessage(error: AxiosError): string {
    const responseData = error.response?.data;
    if (typeof responseData === 'object' && responseData !== null) {
      const { message } = responseData as { message?: unknown };
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    return error.message || 'Remote service error';
  }

  private resolveAxiosError(error: AxiosError): {
    status: number;
    message: string;
  } {
    if (error.code === 'ECONNABORTED') {
      return {
        status: HttpStatus.GATEWAY_TIMEOUT,
        message: 'Request timeout',
      };
    }

    if (!error.response) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service unavailable',
      };
    }

    return {
      status: error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.extractErrorMessage(error),
    };
  }

  private handleAxiosError(error: AxiosError, context: RequestContext): never {
    const duration = Date.now() - context.startTime;

    this.logger.error(
      `HTTP ${context.method.toUpperCase()} ${context.url} failed in ${duration}ms (traceId=${context.traceId})`,
      error.stack || error.message,
    );
    const { status, message } = this.resolveAxiosError(error);

    throw new HttpException(
      {
        traceId: context.traceId,
        duration,
        message,
        status,
        data: context.requestData,
      },
      status,
    );
  }

  private createRequestContext(
    method: HttpMethod,
    path: string,
    data: unknown,
    options: RequestOptions | undefined,
  ): RequestContext {
    const isExternal = this.isExternalTarget(path);

    return {
      traceId: options?.traceId ?? getTraceId() ?? generateTraceId(),
      startTime: Date.now(),
      method,
      url: isExternal ? path : this.getFullURL(path),
      requestData: data,
      isExternal,
    };
  }

  private async sendRequest<T>(
    context: RequestContext,
    options: RequestOptions | undefined,
  ): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.request<T>(this.buildRequestConfig(context, options)),
    );
  }

  private logCompletion(context: RequestContext): void {
    const duration = Date.now() - context.startTime;
    this.logger.log(
      `HTTP ${context.method.toUpperCase()} ${context.url} completed in ${duration}ms (traceId=${context.traceId})`,
    );
  }

  private handleRequestFailure(error: unknown, context: RequestContext): never {
    const duration = Date.now() - context.startTime;
    const axiosError = error as AxiosError;
    if (axiosError?.isAxiosError) {
      this.handleAxiosError(axiosError, context);
    }

    this.logger.error(
      `Final request failed: ${context.method.toUpperCase()} ${context.url}`,
      error as Error,
    );
    throw new HttpException(
      {
        traceId: context.traceId,
        duration,
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected HTTP client error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: context.requestData,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private async executeRequest<T, TResult>(
    method: HttpMethod,
    path: string,
    data: unknown,
    options: RequestOptions | undefined,
    transform: (response: AxiosResponse<T>) => TResult,
  ): Promise<TResult> {
    const context = this.createRequestContext(method, path, data, options);

    try {
      const response = await this.sendRequest<T>(context, options);
      this.logCompletion(context);

      return transform(response);
    } catch (error) {
      return this.handleRequestFailure(error, context);
    }
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<T | AxiosResponse<T>> {
    return this.executeRequest<T, T | AxiosResponse<T>>(
      method,
      path,
      data,
      options,
      (response) => (options?.returnResponse ? response : response.data),
    );
  }

  get<T>(
    path: string,
    options: RequestOptions & { returnResponse: true },
  ): Promise<AxiosResponse<T>>;

  get<T>(path: string, options?: RequestOptions): Promise<T>;

  get<T>(
    path: string,
    options?: RequestOptions,
  ): Promise<T | AxiosResponse<T>> {
    return this.request<T>('get', path, null, options);
  }

  post<T>(
    path: string,
    body: unknown,
    options: RequestOptions & { returnResponse: true },
  ): Promise<AxiosResponse<T>>;

  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;

  post<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T | AxiosResponse<T>> {
    return this.request<T>('post', path, body, options);
  }

  put<T>(
    path: string,
    body: unknown,
    options: RequestOptions & { returnResponse: true },
  ): Promise<AxiosResponse<T>>;

  put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;

  put<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T | AxiosResponse<T>> {
    return this.request<T>('put', path, body, options);
  }

  delete<T>(
    path: string,
    options: RequestOptions & { returnResponse: true },
  ): Promise<AxiosResponse<T>>;

  delete<T>(path: string, options?: RequestOptions): Promise<T>;

  delete<T>(
    path: string,
    options?: RequestOptions,
  ): Promise<T | AxiosResponse<T>> {
    return this.request<T>('delete', path, null, options);
  }
}
