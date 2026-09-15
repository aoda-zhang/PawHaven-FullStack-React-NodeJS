import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient, type animalReports } from '@prismaClient';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
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
    claims: AuthenticatedInternalJwt,
  ): Promise<animalReports> {
    try {
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
          reporterId: claims.sub,
          reporterPhotos: dto.reporterPhotos,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create report animal', error);
      throw new BadRequestException('Failed to submit report');
    }
  }
}
