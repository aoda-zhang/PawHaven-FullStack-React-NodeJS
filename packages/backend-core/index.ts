// Only import and export core models here.
// For performance reasons, submodules are NOT exported from this index file.
// If you need a submodule, please import from its own path (see package.json exports).
export { SharedModule } from './dynamic-modules/shared.module.js';
export { InternalJwtModule } from './dynamic-modules/internal-jwt/internalJwt.module.js';
export { InternalJwtGuard } from './dynamic-modules/internal-jwt/internalJwt.guard.js';
export { InjectPrisma } from './dynamic-modules/prisma/prisma.decorators.js';
export { SwaggerService } from './dynamic-modules/swagger/swagger.service.js';
export { HttpClientService } from './dynamic-modules/http-client/httpClient.service.js';
export { collectServiceConfigSources } from './dynamic-modules/config-module/serviceConfig.js';
export * from './dynamic-modules/SharedModule.type.js';
