import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

const LATEST_RESCUE_LIMIT = 4;

const ADOPTABLE_PET_LIMIT = 6;

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
  ) {}

  async getStats(): Promise<HeroStats> {
    try {
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

      const { data } =
        await this.authClient.get<ApiResponseEnvelope>('/volunteer-count');
      const { count } = data as { count: number };
      return {
        totalRescues,
        totalAdopted: adoptedRescues + adoptedPets,
        totalVolunteers: count,
      };
    } catch (error) {
      this.logger.error('Failed to compute hero stats', error);
      throw new BadRequestException('Failed to compute hero stats');
    }
  }

  async getHomeData(): Promise<HomeData> {
    const [heroStats, latestRescues, adoptablePets] = await Promise.all([
      this.getStats(),
      this.rescueService.findAll(undefined, LATEST_RESCUE_LIMIT),
      this.adoptionService.findAll(undefined, ADOPTABLE_PET_LIMIT),
    ]);

    return {
      heroStats,
      latestRescues,
      adoptablePets,
    };
  }
}
