import { versionExtension } from './version.extension.js';
import { softDeleteExtension } from './softDelete.extension.js';

export const defaultPrismaExtensions = [versionExtension, softDeleteExtension];
