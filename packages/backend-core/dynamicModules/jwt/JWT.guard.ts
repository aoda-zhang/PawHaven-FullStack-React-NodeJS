import {
  Injectable,
  Logger,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { commonDecoratorsKeys } from '@pawhaven/backend-core/decorators';
import { httpBusinessMappingCodes } from '@pawhaven/backend-core/constants';

@Injectable()
export class JWTGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JWTGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublicApi = this.reflector.getAllAndOverride<boolean>(
      commonDecoratorsKeys.publicAPI,
      [context.getHandler(), context.getClass()],
    );
    if (isPublicApi) {
      return true;
    }

    // AuthGuard('jwt') extracts and verifies the token via JwtStrategy
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const errorMessage = err?.message || info?.message || 'Unknown error';
      this.logger.error(`Token verification failed: ${errorMessage}`);
      throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
    }
    // Attach user info to request for later use
    const req = context.switchToHttp().getRequest();
    req.user = user;
    return user;
  }
}
