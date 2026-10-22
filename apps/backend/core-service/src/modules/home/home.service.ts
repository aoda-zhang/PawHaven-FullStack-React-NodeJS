import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
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
    const [totalRescues, adoptedRescues, adoptedPets, totalVolunteers] =
      await Promise.all([
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
        this.getVolunteerCount(),
      ]);

    return {
      totalRescues,
      totalAdopted: adoptedRescues + adoptedPets,
      totalVolunteers,
    };
  }

  async getHomeData(): Promise<HomeData> {
    const latestRescueLimit = this.configService.getOrThrow<number>(
      'featureFlag.latestRescueLimit',
    );
    const adoptablePetLimit = this.configService.getOrThrow<number>(
      'featureFlag.adoptablePetLimit',
    );

    const [heroStats, latestRescues, adoptablePets] = await Promise.all([
      this.getStats(),
      this.rescueService.findAll(undefined, latestRescueLimit),
      this.adoptionService.findAll(undefined, adoptablePetLimit),
    ]);

    return { heroStats, latestRescues, adoptablePets };
  }

  private async getVolunteerCount(): Promise<number> {
    const { data } =
      await this.authClient.get<ApiResponseEnvelope>('/volunteer-count');
    const { count } = data as { count: number };

    if (typeof count !== 'number') {
      throw new Error('Volunteer count response is invalid');
    }

    return count;
  }
}
