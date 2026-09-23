import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
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

const PUBLIC_RESCUE_ROUTE = '/api/core/rescues';

const DATA_URL_PREFIX = 'data:';

const BASE64_MARKER = ';base64,';

export type RescuePhoto = {
  mimeType: string;
  buffer: Buffer;
};

type RescueListRecord = {
  id: string;
  animalType: string | null;
  animalStatus: string | null;
  description: string | null;
  locationObj: unknown;
  reporter: { reporterID: string; reporterName: string | null } | null;
  createdAt: Date;
};

@Injectable()
export class RescueService {
  private readonly logger = new Logger(RescueService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
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
        select: {
          id: true,
          animalType: true,
          animalStatus: true,
          description: true,
          locationObj: true,
          reporter: true,
          createdAt: true,
        },
      });

      const photoBearingIds = await this.findPhotoBearingIds(
        rescues.map((record) => record.id),
      );

      return rescues
        .map((record) =>
          this.toListItemOrSkip(record, photoBearingIds.has(record.id)),
        )
        .filter((item): item is RescueListItem => item !== undefined);
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

  async findPhoto(id: string, index: number): Promise<RescuePhoto> {
    const rescue = await this.prisma.animalReports.findUnique({
      where: { id },
      select: { id: true, deletedAt: true, reporterPhotos: true },
    });
    if (!rescue || rescue.deletedAt) {
      throw new NotFoundException(`Rescue not found: ${id}`);
    }

    const photo = this.decodePhoto(rescue.reporterPhotos?.[index]);
    if (!photo) {
      throw new NotFoundException(`Photo not found: ${id}/${index}`);
    }
    return photo;
  }

  private decodePhoto(stored: string | undefined): RescuePhoto | undefined {
    if (!stored || !stored.startsWith(DATA_URL_PREFIX)) {
      return undefined;
    }
    const markerAt = stored.indexOf(BASE64_MARKER);
    if (markerAt === -1) {
      return undefined;
    }
    const mimeType = stored.slice(DATA_URL_PREFIX.length, markerAt);
    const payload = stored.slice(markerAt + BASE64_MARKER.length);
    if (!mimeType) {
      return undefined;
    }
    return { mimeType, buffer: Buffer.from(payload, 'base64') };
  }

  private buildPhotoUrl(rescueId: string, index: number): string {
    return `${PUBLIC_RESCUE_ROUTE}/${rescueId}/photo/${index}`;
  }

  private async findPhotoBearingIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) {
      return new Set();
    }
    const records = await this.prisma.animalReports.findMany({
      where: { id: { in: ids }, reporterPhotos: { isEmpty: false } },
      select: { id: true },
    });
    return new Set(records.map((record) => record.id));
  }

  private toListItemOrSkip(
    record: RescueListRecord,
    hasPhoto: boolean,
  ): RescueListItem | undefined {
    try {
      return this.toListItem(record, hasPhoto);
    } catch (error) {
      this.logger.warn(`Skipping unmappable rescue: ${record.id}`, error);
      return undefined;
    }
  }

  private toListItem(
    record: RescueListRecord,
    hasPhoto: boolean,
  ): RescueListItem {
    const location = RescueDetailLocationSchema.parse(record.locationObj);

    const status = AnimalStatusSchema.safeParse(record.animalStatus);

    return RescueListItemSchema.parse({
      id: record.id,
      title: record.animalType ?? 'unknown',
      image: hasPhoto ? this.buildPhotoUrl(record.id, 0) : undefined,
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
      photos: record.reporterPhotos.map((_photo, index) =>
        this.buildPhotoUrl(record.id, index),
      ),
      reporter: {
        reporterId: record.reporter?.reporterID ?? '',
        reporterName: record.reporter?.reporterName ?? null,
      },
      reportedAt: record.createdAt.toISOString(),
      distance: 0,
    });
  }
}
