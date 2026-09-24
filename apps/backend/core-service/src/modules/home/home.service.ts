import { ConfigService } from '@nestjs/config';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpClientService, InjectPrisma } from '@pawhaven/backend-core';
import {
  databaseEngines,
  microServiceNames,
} from '@pawhaven/backend-core/constants';
import {
  AnimalStatus,
  ApiResponseEnvelope,
  HeroStats,
  HomeData,
} from '@pawhaven/shared/types';
import { PrismaClient } from '@prismaClient/index.js';

import { AdoptionService } from '../adoption/adoption.service.js';
import { RescueService } from '../rescue/rescue.service.js';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  private readonly authClient = this.httpClientService.create(
    microServiceNames.AUTH,
  );

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
    private readonly rescueService: RescueService,
    private readonly adoptionService: AdoptionService,
    private readonly httpClientService: HttpClientService,
    private readonly configService: ConfigService,
  ) {}

  async getStats(): Promise<HeroStats> {
    const [totalRescues, adoptedRescues, adoptedPets] = await Promise.all([
      this.prisma.animalReports.count({
        where: { deletedAt: { isSet: false } },
      }),
      this.prisma.animalReports.count({
        where: {
          deletedAt: { isSet: false },
          animalStatus: AnimalStatus.ADOPTED,
        },
      }),
      this.prisma.adoptablePet.count({
        where: { deletedAt: { isSet: false }, adoptionStatus: 'adopted' },
      }),
    ]);

    let totalVolunteers = 0;
    try {
      const { data } =
        await this.authClient.get<ApiResponseEnvelope>('/volunteer-count');
      const { count } = data as { count: number };
      totalVolunteers = typeof count === 'number' ? count : 0;
    } catch (error) {
      const httpError = error instanceof HttpException ? error : null;
      const status = httpError ? httpError.getStatus() : 'unknown';
      const payload = httpError ? httpError.getResponse() : null;
      const traceId =
        payload && typeof payload === 'object' && 'traceId' in payload
          ? (payload as Record<string, unknown>).traceId
          : undefined;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Volunteer count from auth-service failed; falling back to totalVolunteers=0. ` +
          `status=${status} message=${message} traceId=${traceId ?? 'n/a'}`,
      );
    }

    return {
      totalRescues,
      totalAdopted: adoptedRescues + adoptedPets,
      totalVolunteers,
    };
  }

  async getHomeData(): Promise<HomeData> {
    const latestRescueLimit = this.configService.get<number>(
      'featureFlag.latestRescueLimit',
      4,
    );
    const adoptablePetLimit = this.configService.get<number>(
      'featureFlag.adoptablePetLimit',
      6,
    );

    const [heroStats, latestRescues, adoptablePets] = await Promise.all([
      this.getStats(),
      this.rescueService.findAll(undefined, latestRescueLimit),
      this.adoptionService.findAll(undefined, adoptablePetLimit),
    ]);

    return {
      heroStats,
      latestRescues,
      adoptablePets,
    };
  }
}
