import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import {
  InternalJwtKind,
  type AuthenticatedInternalJwt,
  type InternalJwt,
} from '@pawhaven/backend-core/types';
import {
  AnimalFollowResultSchema,
  AnimalFollowStatusSchema,
  type AnimalFollowResult,
  type AnimalFollowStatus,
} from '@pawhaven/shared/types';
import { Prisma, PrismaClient } from '@prismaClient/index.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class AnimalFollowService {
  private readonly logger = new Logger(AnimalFollowService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  async follow(
    animalId: string,
    claims: AuthenticatedInternalJwt,
  ): Promise<AnimalFollowResult> {
    try {
      const record = await this.prisma.animalFollow.upsert({
        where: { userId_animalId: { userId: claims.sub, animalId } },
        create: { userId: claims.sub, animalId },
        update: {},
      });

      return await this.toResult(animalId, record.createdAt);
    } catch (error) {
      const existing = await this.recoverFollow(error, animalId, claims);

      if (existing) {
        return this.toResult(animalId, existing.createdAt);
      }

      this.logger.error(`Failed to follow animal: ${animalId}`, error);
      throw new BadRequestException('Failed to follow animal');
    }
  }

  private async recoverFollow(
    error: unknown,
    animalId: string,
    claims: AuthenticatedInternalJwt,
  ): Promise<{ createdAt: Date } | null> {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== UNIQUE_CONSTRAINT_VIOLATION
    ) {
      return null;
    }

    try {
      return await this.prisma.animalFollow.findUnique({
        where: { userId_animalId: { userId: claims.sub, animalId } },
        select: { createdAt: true },
      });
    } catch (recoveryError) {
      this.logger.error(
        `Failed to re-read the existing follow: ${animalId}`,
        recoveryError,
      );
      return null;
    }
  }

  async unfollow(
    animalId: string,
    claims: AuthenticatedInternalJwt,
  ): Promise<AnimalFollowResult> {
    try {
      await this.prisma.animalFollow.deleteMany({
        where: { userId: claims.sub, animalId },
      });

      return await this.toResult(animalId, null);
    } catch (error) {
      this.logger.error(`Failed to unfollow animal: ${animalId}`, error);
      throw new BadRequestException('Failed to unfollow animal');
    }
  }

  async getStatus(
    animalId: string,
    claims?: InternalJwt,
  ): Promise<AnimalFollowResult> {
    const userId =
      claims?.kind === InternalJwtKind.AUTHENTICATED ? claims.sub : null;

    try {
      const record = userId
        ? await this.prisma.animalFollow.findUnique({
            where: { userId_animalId: { userId, animalId } },
          })
        : null;

      return await this.toResult(animalId, record?.createdAt ?? null);
    } catch (error) {
      this.logger.error(`Failed to read follow status: ${animalId}`, error);
      throw new BadRequestException('Failed to read follow status');
    }
  }

  private toStatus(
    animalId: string,
    followedAt: Date | null,
  ): AnimalFollowStatus {
    return AnimalFollowStatusSchema.parse({
      animalId,
      isFollowing: followedAt !== null,
      followedAt: followedAt ? followedAt.toISOString() : null,
    });
  }

  private async toResult(
    animalId: string,
    followedAt: Date | null,
  ): Promise<AnimalFollowResult> {
    const followerCount = await this.prisma.animalFollow.count({
      where: { animalId },
    });

    return AnimalFollowResultSchema.parse({
      ...this.toStatus(animalId, followedAt),
      followerCount,
    });
  }
}
