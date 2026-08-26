import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient';
import {
  RescueListItemSchema,
  AnimalStatusSchema,
  AnimalStatus,
} from '@pawhaven/shared/types';
import type { RescueListItem } from '@pawhaven/shared/types';

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

  async findOne(id: string): Promise<RescueListItem> {
    try {
      const rescue = await this.prisma.animalReports.findUnique({
        where: { id },
      });
      if (!rescue || rescue.deletedAt) {
        throw new BadRequestException(`Rescue not found: ${id}`);
      }
      return this.toListItem(rescue);
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
    const appearance = (r.appearance ?? {}) as Record<string, unknown>;
    const locationObj = (r.locationObj ?? {}) as Record<string, unknown>;
    const reporter = (r.reporter ?? {}) as Record<string, unknown>;
    const reporterName = (reporter.name as string) ?? '';
    const address = (locationObj.address as string) ?? '';

    const status = AnimalStatusSchema.safeParse(r.animalStatus).success
      ? (r.animalStatus as RescueListItem['status'])
      : AnimalStatus.PENDING;

    return RescueListItemSchema.parse({
      id: r.id,
      title: r.name ?? 'Unknown animal',
      image: r.reporterPhotos[0],
      status,
      urgency: appearance.hasInjury === true ? 'high' : 'normal',
      animalType: r.animalType ?? r.animalTypeOther ?? 'unknown',
      location: address,
      description: r.statusDescription ?? '',
      reporter: reporterName,
      reportedAt: r.foundTime ?? r.createdAt.toISOString(),
      distance: 0,
    });
  }
}
