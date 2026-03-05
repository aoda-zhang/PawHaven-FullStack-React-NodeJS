import { join } from 'path';

import { Module } from '@nestjs/common';
import { SharedModule } from '@pawhaven/backend-core';
import { microServiceNames } from '@pawhaven/backend-core/constants';

import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(__dirname, '..'),
      serviceName: microServiceNames.GATEWAY,
      modules: [],
    }),
    ProxyModule,
  ],
})
export class AppModule {}
