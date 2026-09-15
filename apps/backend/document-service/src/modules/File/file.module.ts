import { Module } from '@nestjs/common';

import { FileController } from './file.controller.js';
import { FileService } from './file.service.js';

@Module({
  // imports: [MongooseModule.forFeature([{ name: DBCollection.HISTORY, schema: HistorySchema }])],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
