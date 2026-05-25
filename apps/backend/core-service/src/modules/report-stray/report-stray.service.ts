import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient';

import { CreateReportStrayDto } from './DTO/report-stray.DTO';

@Injectable()
export class ReportStrayService {
  private readonly logger = new Logger(ReportStrayService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  async create(dto: CreateReportStrayDto) {
    try {
      const name =
        dto.animalType === 'other'
          ? (dto.animalTypeOther ?? 'Unknown')
          : dto.animalType;
      const animalID = `stray-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      return await this.prisma.rescue.create({
        data: {
          animalID,
          name,
          location: dto.location?.address ?? '',
          time: new Date(dto.foundTime),
          rescueStatus: 'pending',
          description: JSON.stringify({
            description: dto.statusDescription,
            age: dto.age,
            status: dto.status,
            foundTime: dto.foundTime,
            location: dto.location,
            appearance: dto.appearance,
            contactInfo: dto.contactInfo,
          }),
        },
      });
    } catch (error) {
      this.logger.error('Failed to create report stray', error);
      throw new BadRequestException('Failed to submit report');
    }
  }
}
