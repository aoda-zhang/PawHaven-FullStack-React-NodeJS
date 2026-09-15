import { Controller, Get } from '@nestjs/common';

import { FileService } from './file.service.js';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('/v1/default-trip-views')
  getTrip() {
    return this.fileService.getTripDefaultViews();
  }
}
