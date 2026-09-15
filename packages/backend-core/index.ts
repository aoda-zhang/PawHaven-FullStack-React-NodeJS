// Only import and export core models here.
// For performance reasons, submodules are NOT exported from this index file.
// If you need a submodule, please import from its own path (see package.json exports).
export { SharedModule } from './dynamicModules/shared.module.js';
export { InternalJwtModule } from './dynamicModules/internalJwt/internal-jwt.module.js';
export { InjectPrisma } from './dynamicModules/prisma/prisma.decorators.js';
export { SwaggerService } from './dynamicModules/swagger/swagger.service.js';
export { HttpClientService } from './dynamicModules/httpClient/HttpClient.service.js';
export * from './dynamicModules/sharedModule.type.js';
