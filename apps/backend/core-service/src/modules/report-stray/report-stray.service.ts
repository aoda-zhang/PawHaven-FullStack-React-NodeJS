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
      const img = dto.images?.[0] ?? '';

      return await this.prisma.rescue.create({
        data: {
          animalID,
          name,
          img,
          description: dto.statusDescription ?? '',
          location: dto.location?.address ?? '',
          time: new Date(dto.foundTime),
          rescueStatus: 'pending',
          // Store additional fields as JSON in description field temporarily
          // TODO: extend Prisma schema for full report-stray fields
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
