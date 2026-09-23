import { Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type {
  AuthenticatedInternalJwt,
  InternalJwt as InternalJwtClaims,
} from '@pawhaven/backend-core/types';

import { AnimalFollowService } from './animalFollow.service.js';

@ApiTags('animal-follow')
@Controller('animal-follow')
export class AnimalFollowController {
  constructor(private readonly animalFollowService: AnimalFollowService) {}

  @OptionalAuth()
  @Get(':animalId/status')
  @ApiOperation({
    summary:
      'Get the current user follow status and follower count of an animal',
  })
  getStatus(
    @Param('animalId') animalId: string,
    @InternalJwt({ allowAnonymous: true }) claims: InternalJwtClaims,
  ) {
    return this.animalFollowService.getStatus(animalId, claims);
  }

  @Post(':animalId')
  @ApiOperation({ summary: 'Follow an animal' })
  follow(
    @Param('animalId') animalId: string,
    @InternalJwt() claims: AuthenticatedInternalJwt,
  ) {
    return this.animalFollowService.follow(animalId, claims);
  }

  @Put(':animalId')
  @ApiOperation({ summary: 'Unfollow an animal' })
  unfollow(
    @Param('animalId') animalId: string,
    @InternalJwt() claims: AuthenticatedInternalJwt,
  ) {
    return this.animalFollowService.unfollow(animalId, claims);
  }
}
