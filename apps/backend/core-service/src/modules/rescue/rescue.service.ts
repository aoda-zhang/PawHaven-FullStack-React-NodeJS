import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient';

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
      return await this.prisma.rescue.create({
        data: dto,
      });
    } catch (error) {
      this.logger.error(`Failed to create rescue: ${dto.name}`, error);
      throw new BadRequestException('Failed to create rescue record');
    }
  }

  async findAll(status?: string) {
    try {
      const rescues = await this.prisma.rescue.findMany({
        where: {
          ...(status ? { rescueStatus: status } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
      return rescues.map((r) => ({
        ...r,
        status: r?.rescueStatus,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch rescues', error);
      throw new BadRequestException('Failed to fetch rescues');
    }
  }

  async findOne(id: string) {
    try {
      const rescue = await this.prisma.rescue.findUnique({
        where: { id },
      });
      if (!rescue) {
        throw new BadRequestException(`Rescue not found: ${id}`);
      }
      return rescue;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to fetch rescue: ${id}`, error);
      throw new BadRequestException('Failed to fetch rescue');
    }
  }

  async findByAnimalID(animalID: string) {
    try {
      const rescue = await this.prisma.rescue.findUnique({
        where: { animalID },
      });
      if (!rescue) {
        throw new BadRequestException(`Rescue not found: ${animalID}`);
      }
      return rescue;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to fetch rescue: ${animalID}`, error);
      throw new BadRequestException('Failed to fetch rescue');
    }
  }
}
