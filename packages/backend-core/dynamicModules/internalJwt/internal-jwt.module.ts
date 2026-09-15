import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getRuntimeEnv } from '@pawhaven/shared/utils';
import type { RuntimeEnvType } from '@pawhaven/shared';

import { resolveServiceConfig } from '../configModule/serviceConfig.js';

import { InternalJwtGuard } from './internal-jwt.guard.js';

type InternalJwtConfigFile = {
  internalJwt?: { enabled?: boolean };
};

@Module({})
export class InternalJwtModule {
  static forRoot(serviceName: string, configRoot: string): DynamicModule {
    if (!this.isEnabled(serviceName, configRoot)) {
      return { module: InternalJwtModule };
    }

    return {
      module: InternalJwtModule,
      providers: [
        InternalJwtGuard,
        { provide: APP_GUARD, useExisting: InternalJwtGuard },
      ],
      exports: [InternalJwtGuard],
    };
  }

  private static isEnabled(serviceName: string, configRoot: string): boolean {
    const currentEnv = getRuntimeEnv(process.env.NODE_ENV as RuntimeEnvType);

    let parsedConfig: InternalJwtConfigFile | undefined;
    try {
      parsedConfig = resolveServiceConfig<InternalJwtConfigFile>({
        serviceName,
        configRoot,
        runtimeEnv: currentEnv,
      });
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error);
      throw new Error(
        `[InternalJwtModule] Cannot resolve internalJwt.enabled for service "${serviceName}" (env: ${currentEnv}): ${cause}`,
      );
    }

    const enabled = parsedConfig?.internalJwt?.enabled;

    if (enabled === undefined) {
      throw new Error(
        `[InternalJwtModule] Service "${serviceName}" does not declare internalJwt.enabled (env: ${currentEnv}); SharedModule consumers must set it explicitly (gateway: enabled: false, downstream: enabled: true). Refusing to boot "${serviceName}" without the InternalJwtGuard.`,
      );
    }

    return enabled === true;
  }
}
