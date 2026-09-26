import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ConfigValidationError,
  formatConfigIssues,
  validateConfig,
} from './configValidation.js';
import type {
  ConfigIssue,
  ConfigValidationContext,
} from './configValidation.js';

const buildSchema = () =>
  z.object({
    http: z.object({ port: z.number() }),
    internalJwt: z.object({ keyId: z.string().min(1) }),
    dbConnections: z.array(
      z.object({ options: z.object({ uri: z.string().min(1) }) }),
    ),
  });

const baseContext = (
  config: Record<string, unknown>,
  rawConfig: unknown,
): ConfigValidationContext => ({
  serviceName: 'core-service',
  runtimeEnv: 'prod',
  sources: 'apps/backend/core-service/env',
  config,
  rawConfig,
});

describe('validateConfig', () => {
  it('accepts a fully valid config without throwing', () => {
    const ctx = baseContext(
      {
        http: { port: 8080 },
        internalJwt: { keyId: 'kid-1' },
        dbConnections: [{ options: { uri: 'postgres://db' } }],
      },
      undefined,
    );
    expect(() => validateConfig(ctx, buildSchema())).not.toThrow();
  });

  it('throws ConfigValidationError collecting every issue', () => {
    const ctx = baseContext(
      {
        http: { port: 8080 },
        internalJwt: {},
        dbConnections: [{ options: { uri: '' } }],
      },
      {
        http: { port: 8080 },
        internalJwt: {},
        dbConnections: [{ options: { uri: '${DB_URI}' } }],
      },
    );

    let caught: ConfigValidationError | undefined;
    try {
      validateConfig(ctx, buildSchema());
    } catch (error) {
      caught = error as ConfigValidationError;
    }

    expect(caught).toBeInstanceOf(ConfigValidationError);
    expect(caught?.issues).toHaveLength(2);
    expect(caught?.name).toBe('ConfigValidationError');
  });

  it('annotates an unresolved placeholder with the missing env var', () => {
    const ctx = baseContext(
      {
        http: { port: 8080 },
        internalJwt: {},
        dbConnections: [{ options: { uri: '' } }],
      },
      {
        http: { port: 8080 },
        internalJwt: {},
        dbConnections: [{ options: { uri: '${DB_URI}' } }],
      },
    );

    let caught: ConfigValidationError | undefined;
    try {
      validateConfig(ctx, buildSchema());
    } catch (error) {
      caught = error as ConfigValidationError;
    }

    const uriIssue = caught?.issues.find(
      (i) => i.path === 'dbConnections[0].options.uri',
    );
    expect(uriIssue).toBeDefined();
    expect(uriIssue?.message).toContain('env var DB_URI is not set');
  });

  it('does not add an env hint when the raw value is not a placeholder', () => {
    const ctx = baseContext(
      {
        http: { port: 8080 },
        internalJwt: {},
        dbConnections: [{ options: { uri: '' } }],
      },
      {
        http: { port: 8080 },
        internalJwt: {},
        dbConnections: [{ options: { uri: 'postgres://db' } }],
      },
    );

    let caught: ConfigValidationError | undefined;
    try {
      validateConfig(ctx, buildSchema());
    } catch (error) {
      caught = error as ConfigValidationError;
    }

    expect(caught?.issues.some((i) => i.message.includes('env var'))).toBe(
      false,
    );
  });
});

describe('formatConfigIssues', () => {
  const issues: ConfigIssue[] = [
    { path: 'internalJwt.keyId', code: 'invalid_type', message: 'Required' },
    {
      path: 'dbConnections[0].options.uri',
      code: 'too_small',
      message:
        'String must contain at least 1 character(s) (env var DB_URI is not set)',
    },
  ];

  it('produces a header with the service name, env line, numbered list and refused-to-start line', () => {
    const output = formatConfigIssues(
      'core-service',
      'prod',
      'apps/backend/core-service/env',
      issues,
    );

    expect(output).toContain('core-service configuration is invalid');
    expect(output).toContain('env: prod');
    expect(output).toMatch(/1\.\s+internalJwt\.keyId/);
    expect(output).toMatch(/2\.\s+dbConnections\[0\]\.options\.uri/);
    expect(output).toContain('core-service refused to start');
    expect(output).toContain('No HTTP listener was opened');
  });

  it('uses singular "problem" wording for a single issue', () => {
    const output = formatConfigIssues('svc', 'dev', 'src', [issues[0]]);
    expect(output).toContain('1 problem:');
    expect(output).not.toContain('1 problems:');
  });
});
