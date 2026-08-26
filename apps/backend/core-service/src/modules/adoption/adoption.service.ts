import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient';
import { AdoptablePetSchema } from '@pawhaven/shared/types';
import type { AdoptablePet } from '@pawhaven/shared/types';

@Injectable()
export class AdoptionService {
  private readonly logger = new Logger(AdoptionService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  async findAll(status?: string, limit?: number): Promise<AdoptablePet[]> {
    try {
      const parsedLimit = Number(limit);
      const take =
        Number.isInteger(parsedLimit) && parsedLimit > 0
          ? parsedLimit
          : undefined;

      const pets = await this.prisma.adoptablePet.findMany({
        where: {
          deletedAt: { isSet: false },
          ...(status ? { adoptionStatus: status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take,
      });

      return pets.map((pet) => this.toContract(pet));
    } catch (error) {
      this.logger.error('Failed to fetch adoptable pets', error);
      throw new BadRequestException('Failed to fetch adoptable pets');
    }
  }

  async findOne(id: string): Promise<AdoptablePet> {
    try {
      const pet = await this.prisma.adoptablePet.findUnique({
        where: { id },
      });
      if (!pet || pet.deletedAt) {
        throw new BadRequestException(`Adoptable pet not found: ${id}`);
      }
      return this.toContract(pet);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to fetch adoptable pet: ${id}`, error);
      throw new BadRequestException('Failed to fetch adoptable pet');
    }
  }

  private toContract(pet: {
    id: string;
    name: string;
    animalType: string;
    age: string;
    sex: string;
    breed: string;
    location: string;
    waitingDays: number;
    tags: string[];
    photo: string;
    rescuedFrom: string;
    rescueDuration: string;
    medicalRecords: string[];
    temperament: string;
    adoptionStatus: string;
  }): AdoptablePet {
    return AdoptablePetSchema.parse({
      id: pet.id,
      name: pet.name,
      animalType: pet.animalType,
      age: pet.age,
      sex: pet.sex,
      breed: pet.breed,
      location: pet.location,
      waitingDays: pet.waitingDays,
      tags: pet.tags,
      photo: pet.photo,
      rescuedFrom: pet.rescuedFrom,
      rescueDuration: pet.rescueDuration,
      medicalRecords: pet.medicalRecords,
      temperament: pet.temperament,
      adoptionStatus: pet.adoptionStatus,
    });
  }
}
