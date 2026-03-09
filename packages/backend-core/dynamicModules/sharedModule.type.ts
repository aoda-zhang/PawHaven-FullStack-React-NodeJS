import { PrismaModuleOptions } from './prisma/prisma.module';

/**
 * =========================
 * Predefined Shared Module Features
 * =========================
 * Only these modules can be loaded through SharedModule.forRoot()
 * For service-specific modules, import them directly in your AppModule
 */
export const SharedModuleFeatures = {
  PrismaModule: 'PrismaModule',
  SwaggerModule: 'SwaggerModule',
  MonitoringModule: 'MonitoringModule',
} as const;

export type SharedModuleName = keyof typeof SharedModuleFeatures;

/**
 * Module options mapping
 * - `never` means this module does not require options
 * - For typed options, specify the interface (e.g., PrismaModuleOptions)
 */
export interface SharedModuleOptionMap {
  [SharedModuleFeatures.PrismaModule]: PrismaModuleOptions;
  [SharedModuleFeatures.SwaggerModule]: never;
  [SharedModuleFeatures.MonitoringModule]: never;
}

/**
 * Module item with automatic type inference
 * - If options type is `never`, the `options` property is not required
 * - If options type is defined, the `options` property is required and typed
 */
export type SharedModuleItem = {
  [K in SharedModuleName]: SharedModuleOptionMap[K] extends never
    ? { module: K }
    : { module: K; options: SharedModuleOptionMap[K] };
}[SharedModuleName];
