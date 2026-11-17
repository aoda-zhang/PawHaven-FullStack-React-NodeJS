import { Module } from '@nestjs/common';

import { SwaggerService } from './swagger.service.js';

@Module({
  providers: [SwaggerService],
  exports: [SwaggerService],
})
export class SwaggerModule {}
