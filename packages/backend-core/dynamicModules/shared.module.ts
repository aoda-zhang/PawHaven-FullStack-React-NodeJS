import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

import { MiddlewareModule } from '../middlewares/index.module';

import { HttpSuccessInterceptor } from './httpClient/httpInterceptor';
import { HttpExceptionFilter } from './httpClient/httpExceptionFilter';
import { SwaggerModule } from './swagger/swagger.module';
import { ConfigsModule } from './configModule/configs.module';
import { HttpClientModule } from './httpClient/httpClient.module';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModuleFeatures, SharedModuleItem } from './sharedModule.type';

/**
 * SharedModule configuration options
 * Only accepts predefined shared modules, not custom providers or modules
 */
interface SharedModuleForRootOptions {
  serviceRoot: string;
  serviceName: string;
  /**
   * Optional predefined shared modules to load
   * Only accepts modules from SharedModuleFeatures enum
   */
  modules?: SharedModuleItem[];
}

@Global()
@Module({})
export class SharedModule {
  /**
   * Configure SharedModule with predefined modules only
   * For service-specific modules or providers, import them directly in your AppModule
   */
  static forRoot(options: SharedModuleForRootOptions): DynamicModule {
    const { serviceRoot, serviceName, modules = [] } = options;

    const defaultModules = this.getDefaultModules(serviceRoot, serviceName);
    const optionalModules = this.loadOptionalModules(modules);
    const sharedProviders = this.getSharedProviders();

    return {
      module: SharedModule,
      imports: [...defaultModules, ...optionalModules],
      exports: [...defaultModules, ...optionalModules],
      providers: sharedProviders,
    };
  }

  /**
   * Core modules required by all services
   * - ConfigsModule: Environment configuration
   * - HttpClientModule: HTTP client utilities
   */
  private static getDefaultModules(
    serviceRoot: string,
    serviceName: string,
  ): Array<Type<any> | DynamicModule> {
    return [ConfigsModule.forRoot(serviceRoot, serviceName), HttpClientModule];
  }

  /**
   * Load optional predefined shared modules
   * Only modules defined in SharedModuleFeatures are allowed
   */
  private static loadOptionalModules(
    items: SharedModuleItem[],
  ): Array<Type<any> | DynamicModule> {
    return items.map((item) => {
      switch (item.module) {
        case SharedModuleFeatures.PrismaModule:
          return PrismaModule.forRoot(item?.options);

        case SharedModuleFeatures.SwaggerModule:
          return SwaggerModule;

        case SharedModuleFeatures.MonitoringModule:
          return MiddlewareModule;

        default: {
          const _exhaustiveCheck: never = item;
          throw new Error(
            `Unknown shared module: ${JSON.stringify(_exhaustiveCheck)}`,
          );
        }
      }
    });
  }

  /**
   * Global providers applied to all services
   * - HttpExceptionFilter: Standardizes error responses
   * - HttpSuccessInterceptor: Standardizes success responses
   * - ZodValidationPipe: Validates request DTOs
   */
  private static getSharedProviders(): Provider[] {
    return [
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      { provide: APP_INTERCEPTOR, useClass: HttpSuccessInterceptor },
      { provide: APP_PIPE, useClass: ZodValidationPipe },
    ];
  }
}
