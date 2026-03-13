import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete';

interface RequestOptions {
  headers?: Record<string, string>;
  config?: AxiosRequestConfig;
  returnResponse?: boolean;
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
}

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;

export class HttpClientInstance {
  private readonly fallbackTimeout = DEFAULT_REQUEST_TIMEOUT_MS;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly serviceName: string,
    private readonly defaultHeaders: Record<string, string>,
    private readonly logger: Logger,
  ) {}

  private getCurrentMicroserviceOption(): MicroserviceOption {
    const allMicroservices =
      this.configService.get<MicroserviceConfigItem[]>('microServices') ?? [];
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

  private getFullURL(path: string): string {
    const currentMicroserviceOption = this.getCurrentMicroserviceOption();
    const cleanedBase = this.resolveServiceOrigin(currentMicroserviceOption);
    const cleanedPath = path?.trim()?.replace(/^\/+/, '');

    const fullUrl = cleanedPath ? `${cleanedBase}/${cleanedPath}` : cleanedBase;
    if (!fullUrl) {
      throw new Error(`Invalid composed URL: "${fullUrl}"`);
    }

    return fullUrl;
  }

  private buildRequestConfig(
    context: RequestContext,
    options?: RequestOptions,
  ): AxiosRequestConfig {
    const headers = {
      ...this.defaultHeaders,
      ...options?.headers,
      'x-trace-id': context.traceId,
    };

    return {
      timeout:
        this.configService.get<number>('http.timeout') ?? this.fallbackTimeout,
      ...options?.config,
      method: context.method,
      url: context.url,
      headers,
      data: context.requestData,
    };
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

  private async executeRequest<T, TResult>(
    method: HttpMethod,
    path: string,
    data: unknown,
    options: RequestOptions | undefined,
    transform: (response: AxiosResponse<T>) => TResult,
  ): Promise<TResult> {
    const context: RequestContext = {
      traceId: uuidv4(),
      startTime: Date.now(),
      method,
      url: this.getFullURL(path),
      requestData: data,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request<T>(this.buildRequestConfig(context, options)),
      );

      const duration = Date.now() - context.startTime;
      this.logger.log(
        `HTTP ${method.toUpperCase()} ${context.url} completed in ${duration}ms (traceId=${context.traceId})`,
      );

      return transform(response);
    } catch (error) {
      const duration = Date.now() - context.startTime;
      const axiosError = error as AxiosError;
      if (axiosError?.isAxiosError) {
        this.handleAxiosError(axiosError, context);
      }

      this.logger.error(
        `Final request failed: ${method.toUpperCase()} ${context.url}`,
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
