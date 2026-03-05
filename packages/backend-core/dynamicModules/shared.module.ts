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
import { JWTModule } from './jwt/JWT.module';
import { SharedModuleFeatures, SharedModuleItem } from './sharedModule.type';

interface SharedModuleForRootOptions {
  serviceRoot: string;
  serviceName: string;
  modules?: SharedModuleItem[];
  providers?: Provider[];
}

@Global()
@Module({})
export class SharedModule {
  static forRoot(options: SharedModuleForRootOptions): DynamicModule {
    const { serviceRoot, serviceName, modules = [], providers = [] } = options;

    const defaultModules = this.getDefaultModules(serviceRoot, serviceName);

    const loadedExtraModules = this.loadExtraModules(modules);

    const defaultProviders = this.getDefaultProviders();

    const loadedExtraProviders = this.loadExtraProviders(providers);

    return {
      module: SharedModule,
      imports: [...defaultModules, ...loadedExtraModules],
      exports: [...defaultModules, ...loadedExtraModules],
      providers: [...defaultProviders, ...loadedExtraProviders],
    };
  }

  private static getDefaultModules(
    serviceRoot: string,
    serviceName: string,
  ): Array<Type<any> | DynamicModule> {
    return [ConfigsModule.forRoot(serviceRoot, serviceName), HttpClientModule];
  }

  private static loadExtraModules(
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

        case SharedModuleFeatures.JWTModule:
          return JWTModule;

        default:
          throw new Error(`Unknown module: ${item}`);
      }
    });
  }

  private static getDefaultProviders(): Provider[] {
    return [
      // Global exception filter - catches and formats all thrown HTTP exceptions
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      // Global interceptor - wraps all successful responses with consistent response format
      { provide: APP_INTERCEPTOR, useClass: HttpSuccessInterceptor },
      // Global pipe - validates request body/query/params using Zod schemas from nestjs-zod
      {
        provide: APP_PIPE,
        useClass: ZodValidationPipe,
      },
    ];
  }

  private static loadExtraProviders(providers: Provider[]): Provider[] {
    return [...providers];
  }
}
