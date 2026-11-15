import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { InternalJwtKind, type InternalJwt } from '@pawhaven/backend-core/types';
import { AnimalStatus, type AnimalReportDto } from '@pawhaven/shared/types';
import { PrismaClient } from '@prismaClient/index.js';

@Injectable()
export class ReportAnimalService {
  private readonly logger = new Logger(ReportAnimalService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    dto: AnimalReportDto,
    claims: InternalJwt,
  ): Promise<{ id: string }> {
    try {
      return await this.prisma.animalReports.create({
        select: { id: true },
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
          reporter:
            claims.kind === InternalJwtKind.AUTHENTICATED
              ? {
                  reporterID: claims.sub,
                  reporterName: claims.username?.trim() || null,
                }
              : null,
          reporterEmail: dto.contactInfo.email?.trim() || null,
          reporterPhotos: dto.reporterPhotos,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create report animal', error);
      throw new BadRequestException('Failed to submit report');
    }
  }
}
