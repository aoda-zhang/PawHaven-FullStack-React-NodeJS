import { Module } from '@nestjs/common';

import { ReportStrayController } from './report-stray.controller';
import { ReportStrayService } from './report-stray.service';

@Module({
  controllers: [ReportStrayController],
  providers: [ReportStrayService],
  exports: [ReportStrayService],
})
export class ReportStrayModule {}