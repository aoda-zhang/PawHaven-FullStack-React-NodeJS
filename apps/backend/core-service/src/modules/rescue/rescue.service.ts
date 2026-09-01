import type { IncomingHttpHeaders } from 'http';

import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines, httpHeaders } from '@pawhaven/backend-core/constants';
import { readHeader } from '@pawhaven/backend-core/utils';
import { PrismaClient, type animalReports } from '@prismaClient';
import {
  RescueListItemSchema,
  RescueDetailSchema,
  RescueDetailAppearanceSchema,
  RescueDetailLocationSchema,
  AnimalStatusSchema,
  RescueAgeSchema,
  AnimalStatus,
} from '@pawhaven/shared/types';
import type { RescueListItem, RescueDetail } from '@pawhaven/shared/types';

import { CreateRescueDto } from './DTO/rescue.DTO';

@Injectable()
export class RescueService {
  private readonly logger = new Logger(RescueService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  async create(dto: CreateRescueDto, headers: IncomingHttpHeaders = {}) {
    const reporterId = readHeader(headers, httpHeaders.authUserId);

    if (!reporterId) {
      throw new UnauthorizedException('Reporter identity is required');
    }

    try {
      return await this.prisma.animalReports.create({
        data: { ...dto, reporterId },
      });
    } catch (error) {
      this.logger.error(`Failed to create rescue: ${dto.animalType}`, error);
      throw new BadRequestException('Failed to create rescue record');
    }
  }

  async findAll(status?: string, limit?: number): Promise<RescueListItem[]> {
    try {
      const parsedLimit = Number(limit);
      const take =
        Number.isInteger(parsedLimit) && parsedLimit > 0
          ? parsedLimit
          : undefined;

      const rescues = await this.prisma.animalReports.findMany({
        where: {
          deletedAt: { isSet: false },
          ...(status ? { animalStatus: status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take,
      });
      return rescues.map((record) => this.toListItem(record));
    } catch (error) {
      this.logger.error('Failed to fetch rescues', error);
      throw new BadRequestException('Failed to fetch rescues');
    }
  }

  async findOne(id: string): Promise<RescueDetail> {
    try {
      const rescue = await this.prisma.animalReports.findUnique({
        where: { id },
      });
      if (!rescue || rescue.deletedAt) {
        throw new BadRequestException(`Rescue not found: ${id}`);
      }
      return this.toDetail(rescue);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to fetch rescue: ${id}`, error);
      throw new BadRequestException('Failed to fetch rescue');
    }
  }

  private toListItem(record: animalReports): RescueListItem {
    const location = RescueDetailLocationSchema.parse(record.locationObj ?? {});

    const status = AnimalStatusSchema.safeParse(record.animalStatus);

    return RescueListItemSchema.parse({
      id: record.id,
      title: record.animalType ?? 'unknown',
      image: record.reporterPhotos?.[0],
      status: status.success ? status.data : AnimalStatus.PENDING,
      animalType: record.animalType ?? 'unknown',
      location: location.address,
      description: record.description,
      reporterId: record.reporterId,
      reportedAt: record.createdAt.toISOString(),
      distance: 0,
    });
  }

  private toDetail(record: animalReports): RescueDetail {
    const status = AnimalStatusSchema.safeParse(record.animalStatus);
    const age = RescueAgeSchema.safeParse(record.age);

    return RescueDetailSchema.parse({
      id: record.id,
      animalType: record.animalType ?? 'unknown',
      age: age.success ? age.data : 'adult',
      status: status.success ? status.data : AnimalStatus.PENDING,
      statusDescription: record.statusDescription,
      description: record.description,
      size: record.size,
      animalCount: record.animalCount,
      appearance: RescueDetailAppearanceSchema.parse(record.appearance ?? {}),
      location: RescueDetailLocationSchema.parse(record.locationObj ?? {}),
      photos: record.reporterPhotos,
      reporter: { reporterId: record.reporterId },
      reportedAt: record.createdAt.toISOString(),
      distance: 0,
    });
  }
}
