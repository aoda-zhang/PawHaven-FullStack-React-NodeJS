import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HttpClientService } from './HttpClient.service.js';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}
