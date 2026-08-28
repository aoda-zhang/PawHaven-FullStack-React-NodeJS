import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient';
import {
  RescueListItemSchema,
  RescueDetailSchema,
  RescueDetailAppearanceSchema,
  RescueDetailLocationSchema,
  RescueDetailReporterSchema,
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

  async create(dto: CreateRescueDto) {
    try {
      return await this.prisma.animalReports.create({
        data: dto,
      });
    } catch (error) {
      this.logger.error(`Failed to create rescue: ${dto.name}`, error);
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
      return rescues.map((r) => this.toListItem(r));
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

  private toListItem(r: {
    id: string;
    name: string | null;
    animalType: string | null;
    animalTypeOther: string | null;
    appearance: unknown;
    locationObj: unknown;
    foundTime: string | null;
    animalStatus: string | null;
    statusDescription: string | null;
    reporter: unknown;
    reporterPhotos: string[];
    createdAt: Date;
  }): RescueListItem {
    const appearance = RescueDetailAppearanceSchema.parse(r.appearance ?? {});
    const location = RescueDetailLocationSchema.parse(r.locationObj ?? {});
    const reporter = RescueDetailReporterSchema.parse(r.reporter ?? {});

    const status = AnimalStatusSchema.safeParse(r.animalStatus);

    return RescueListItemSchema.parse({
      id: r.id,
      title: r.name ?? 'Unknown animal',
      image: r.reporterPhotos[0],
      status: status.success ? status.data : AnimalStatus.PENDING,
      urgency: appearance.hasInjury === true ? 'high' : 'normal',
      animalType: r.animalType ?? r.animalTypeOther ?? 'unknown',
      location: location.address ?? '',
      description: r.statusDescription ?? '',
      reporter: reporter.name ?? '',
      reportedAt: r.foundTime ?? r.createdAt.toISOString(),
      distance: 0,
    });
  }

  private toDetail(r: {
    id: string;
    name: string | null;
    animalType: string | null;
    animalTypeOther: string | null;
    age: string | null;
    appearance: unknown;
    locationObj: unknown;
    foundTime: string | null;
    animalStatus: string | null;
    statusDescription: string | null;
    reporter: unknown;
    reporterPhotos: string[];
    videos: string[];
    createdAt: Date;
    updatedAt: Date;
  }): RescueDetail {
    const status = AnimalStatusSchema.safeParse(r.animalStatus);
    const age = RescueAgeSchema.safeParse(r.age);

    return RescueDetailSchema.parse({
      id: r.id,
      name: r.name ?? 'Unknown animal',
      animalType: r.animalType ?? r.animalTypeOther ?? 'unknown',
      age: age.success ? age.data : undefined,
      foundTime: r.foundTime ?? undefined,
      status: status.success ? status.data : AnimalStatus.PENDING,
      statusDescription: r.statusDescription ?? undefined,
      description: r.statusDescription ?? undefined,
      appearance: RescueDetailAppearanceSchema.parse(r.appearance ?? {}),
      location: RescueDetailLocationSchema.parse(r.locationObj ?? {}),
      photos: r.reporterPhotos,
      videos: r.videos,
      reporter: RescueDetailReporterSchema.parse(r.reporter ?? {}),
      reportedAt: r.foundTime ?? r.createdAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    });
  }
}
