import { readFileSync } from 'fs';
import { join } from 'path';

import { describe, expect, it } from 'vitest';

import { storageConfigSchema } from './storageConfig.schema.js';

const readStorage = (env: string) =>
  JSON.parse(
    readFileSync(join(import.meta.dirname, env, 'env/index.json'), 'utf8'),
  ).storage;

const resolvePlaceholders = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.replace(/\$\{([A-Z_]+)\}/g, (_match, key: string) =>
      key === 'BLOB_READ_WRITE_TOKEN' ? 'test-token' : '',
    );
  }
  if (Array.isArray(value)) {
    return value.map(resolvePlaceholders);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        resolvePlaceholders(entry),
      ]),
    );
  }
  return value;
};

const envFiles = ['dev', 'test', 'uat', 'prod'] as const;

describe('storageConfigSchema', () => {
  it.each(envFiles)('accepts the %s environment storage block', (env) => {
    const parsed = storageConfigSchema.parse(
      resolvePlaceholders(readStorage(env)),
    );

    expect(parsed.provider).toBe('vercel');
  });
});
