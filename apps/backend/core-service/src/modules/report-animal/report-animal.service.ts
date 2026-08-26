import type { IncomingHttpHeaders } from 'http';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient';
import { AnimalStatus } from '@pawhaven/shared/types';

import { CreateReportAnimalDto } from './DTO/report-animal.DTO';

@Injectable()
export class ReportAnimalService {
  private readonly logger = new Logger(ReportAnimalService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  async create(dto: CreateReportAnimalDto, headers: IncomingHttpHeaders = {}) {
    try {
      const name =
        dto.animalType === 'other'
          ? (dto.animalTypeOther ?? 'Unknown')
          : dto.animalType;
      const reporter = {
        userId: this.readHeader(headers, 'x-auth-user-id'),
        email: this.readHeader(headers, 'x-auth-user-email'),
        roles: this.readHeader(headers, 'x-auth-user-roles'),
      };

      return await this.prisma.animalReports.create({
        data: {
          name,
          animalType: dto.animalType,
          animalTypeOther: dto.animalTypeOther,
          age: dto.age,
          appearance: dto.appearance,
          locationObj: dto.location,
          foundTime: dto.foundTime,
          animalStatus: AnimalStatus.PENDING,
          statusDescription: dto.statusDescription,
          reporter,
          reporterPhotos: [],
          videos: [],
        },
      });
    } catch (error) {
      this.logger.error('Failed to create report animal', error);
      throw new BadRequestException('Failed to submit report');
    }
  }

  private readHeader(
    headers: IncomingHttpHeaders,
    key: string,
  ): string | undefined {
    const value = headers[key];
    if (Array.isArray(value)) return value[0];
    return value;
  }
}
