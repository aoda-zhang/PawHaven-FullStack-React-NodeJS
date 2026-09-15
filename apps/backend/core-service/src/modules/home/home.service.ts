import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { AnimalStatus, HeroStats, HomeData } from '@pawhaven/shared/types';
import { PrismaClient } from '@prismaClient/index.js';

import { AdoptionService } from '../adoption/adoption.service.js';
import { RescueService } from '../rescue/rescue.service.js';

const VOLUNTEER_BASELINE = 120;

const LATEST_RESCUE_LIMIT = 4;

const ADOPTABLE_PET_LIMIT = 6;

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
    private readonly rescueService: RescueService,
    private readonly adoptionService: AdoptionService,
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

      return {
        totalRescues,
        totalAdopted: adoptedRescues + adoptedPets,
        totalVolunteers: VOLUNTEER_BASELINE,
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
