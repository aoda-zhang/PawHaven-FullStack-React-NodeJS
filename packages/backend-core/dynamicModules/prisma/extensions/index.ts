import { versionExtension } from './version.extension.js';
import { softDeleteExtension } from './soft-delete.extension.js';

export const defaultPrismaExtensions = [versionExtension, softDeleteExtension];
