import { Module } from '@nestjs/common';

import { BootstrapController } from './bootstrap.controller.js';
import { BootstrapService } from './bootstrap.service.js';

@Module({
  controllers: [BootstrapController],
  providers: [BootstrapService],
  exports: [BootstrapService],
})
export class BootstrapModule {}
