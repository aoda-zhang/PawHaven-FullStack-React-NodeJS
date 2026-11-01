import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { ConfigService } from '@nestjs/config';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import {
  RescueListItemSchema,
  RescueDetailSchema,
  RescueDetailAppearanceSchema,
  RescueDetailLocationSchema,
  AnimalStatusSchema,
  RescueAgeSchema,
  AnimalStatus,
} from '@pawhaven/shared/types';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
import type {
  CreateRescueDto,
  RescueListItem,
  RescueDetail,
} from '@pawhaven/shared/types';
import { PrismaClient, type animalReports } from '@prismaClient/index.js';

const RESCUE_LIST_SELECT = {
  id: true,
  animalType: true,
  animalStatus: true,
  description: true,
  locationObj: true,
  reporter: true,
  reporterPhotos: true,
  createdAt: true,
} as const;

type RescueListRecord = {
  id: string;
  animalType: string | null;
  animalStatus: string | null;
  description: string | null;
  locationObj: unknown;
  reporter: { reporterID: string; reporterName: string | null } | null;
  reporterPhotos: string[];
  createdAt: Date;
};

@Injectable()
export class RescueService {
  private readonly logger = new Logger(RescueService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
    private readonly configs: ConfigService,
  ) {}

  async create(dto: CreateRescueDto, claims: AuthenticatedInternalJwt) {
    try {
      return await this.prisma.animalReports.create({
        data: {
          ...dto,
          reporter: {
            reporterID: claims.sub,
            reporterName: claims.username?.trim() || null,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create rescue: ${dto.animalType}`, error);
      throw new BadRequestException('Failed to create rescue record');
    }
  }

  async findAll(status?: string, limit?: number): Promise<RescueListItem[]> {
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
      select: RESCUE_LIST_SELECT,
    });

    return rescues
      .map((record) => this.toListItemOrSkip(record))
      .filter((item): item is RescueListItem => item !== undefined);
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

  private fileUrl(key: string): string {
    const base = this.configs.getOrThrow<string>('files.publicBaseUrl');
    return `${base.replace(/\/$/, '')}/${key}`;
  }

  private toListItemOrSkip(
    record: RescueListRecord,
  ): RescueListItem | undefined {
    try {
      return this.toListItem(record);
    } catch (error) {
      this.logger.warn(`Skipping unmappable rescue: ${record.id}`, error);
      return undefined;
    }
  }

  private toListItem(record: RescueListRecord): RescueListItem {
    const location = RescueDetailLocationSchema.parse(record.locationObj);

    const status = AnimalStatusSchema.safeParse(record.animalStatus);

    const [coverImage] = record.reporterPhotos;

    return RescueListItemSchema.parse({
      id: record.id,
      title: record.animalType ?? 'unknown',
      image: coverImage ? this.fileUrl(coverImage) : undefined,
      status: status.success ? status.data : AnimalStatus.PENDING,
      animalType: record.animalType ?? 'unknown',
      location: location.address,
      description: record.description,
      reporterId: record.reporter?.reporterID ?? '',
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
      appearance: RescueDetailAppearanceSchema.parse(record.appearance),
      location: RescueDetailLocationSchema.parse(record.locationObj),
      photos: record.reporterPhotos.map((key) => this.fileUrl(key)),
      reporter: {
        reporterId: record.reporter?.reporterID ?? '',
        reporterName: record.reporter?.reporterName ?? null,
      },
      reportedAt: record.createdAt.toISOString(),
      distance: 0,
    });
  }
}
