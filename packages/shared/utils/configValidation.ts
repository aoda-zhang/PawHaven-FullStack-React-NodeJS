import type { z } from 'zod';

export interface ConfigIssue {
  path: string;
  code: string;
  message: string;
}

export interface ConfigValidationContext {
  serviceName: string;
  runtimeEnv: string;
  sources: string;
  config: Record<string, unknown>;
  rawConfig?: unknown;
}

export type ConfigSchema = z.ZodType;

type IssuePathSegment = string | number | symbol;

const PLACEHOLDER_PATTERN = /^\$\{([^}]+)\}$/;

const formatPath = (path: IssuePathSegment[]): string =>
  path.reduce<string>((acc, segment, index) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }
    return index === 0 ? String(segment) : `${acc}.${String(segment)}`;
  }, '');

const readAtPath = (source: unknown, path: IssuePathSegment[]): unknown =>
  path.reduce<unknown>((acc, segment) => {
    if (acc === null || typeof acc !== 'object') {
      return undefined;
    }
    return (acc as Record<IssuePathSegment, unknown>)[segment];
  }, source);

const describeMissingEnvVar = (
  path: IssuePathSegment[],
  rawConfig?: unknown,
): string => {
  const raw = readAtPath(rawConfig, path);
  if (typeof raw !== 'string') {
    return '';
  }
  const match = PLACEHOLDER_PATTERN.exec(raw.trim());
  return match ? ` (env var ${match[1].trim()} is not set)` : '';
};

export const formatConfigIssues = (
  serviceName: string,
  runtimeEnv: string,
  sources: string,
  issues: ConfigIssue[],
): string => {
  const total = issues.length;
  const header = `${serviceName} configuration is invalid
  env: ${runtimeEnv} | sources: ${sources}
  ${total} problem${total === 1 ? '' : 's'}:`;

  const body = issues.map(
    (issue, index) =>
      `    ${index + 1}. ${issue.path}\n       ${issue.message}`,
  );

  return [
    header,
    '',
    ...body,
    '',
    `  ${serviceName} refused to start. No HTTP listener was opened.`,
  ].join('\n');
};

export class ConfigValidationError extends Error {
  readonly issues: ConfigIssue[];

  constructor(context: ConfigValidationContext, issues: ConfigIssue[]) {
    super(
      formatConfigIssues(
        context.serviceName,
        context.runtimeEnv,
        context.sources,
        issues,
      ),
    );
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

export const validateConfig = (
  context: ConfigValidationContext,
  schema: ConfigSchema,
): void => {
  const result = schema.safeParse(context.config);

  if (result.success) {
    return;
  }

  const issues: ConfigIssue[] = result.error.issues.map((issue) => {
    const path = formatPath(issue.path);
    const envHint = describeMissingEnvVar(issue.path, context.rawConfig);

    return {
      path: path || '(root)',
      code: issue.code,
      message: `${issue.message}${envHint}`,
    };
  });

  throw new ConfigValidationError(context, issues);
};
