import type { IncomingHttpHeaders } from 'http';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines, httpHeaders } from '@pawhaven/backend-core/constants';
import { readHeader } from '@pawhaven/backend-core/utils';
import { PrismaClient, type animalReports } from '@prismaClient';
import { AnimalStatus, type AnimalReportDto } from '@pawhaven/shared/types';

@Injectable()
export class ReportAnimalService {
  private readonly logger = new Logger(ReportAnimalService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    dto: AnimalReportDto,
    headers: IncomingHttpHeaders = {},
  ): Promise<animalReports> {
    try {
      const reporterId = readHeader(headers, httpHeaders.authUserId);

      return await this.prisma.animalReports.create({
        data: {
          animalType: dto.animalType,
          age: dto.age,
          appearance: dto.appearance,
          locationObj: dto.location,
          animalStatus: AnimalStatus.PENDING,
          statusDescription: dto.statusDescription,
          description: dto.description,
          size: dto.size,
          animalCount: dto.animalCount,
          reporterId,
          reporterPhotos: dto.reporterPhotos,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create report animal', error);
      throw new BadRequestException('Failed to submit report');
    }
  }
}
