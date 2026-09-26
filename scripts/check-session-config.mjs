import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENVIRONMENTS = ['dev', 'test', 'uat', 'prod'];
const AUTH_USING_SERVICES = ['gateway', 'auth-service'];

const AUTH_KEYS = [
  'jwtExpiresIn',
  'jwtClockTolerance',
  'jwtRefreshFallbackSeconds',
  'jwtRefreshWindowPercentage',
  'refreshTokenExpiresIn',
  'refreshTokenRotationWindowSeconds',
  'sessionExpiresIn',
];

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readAuthConfig(service, env) {
  const file = resolve(
    repoRoot,
    'apps/backend',
    service,
    'src/config',
    env,
    'env/index.json',
  );
  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  return { file, auth: parsed.auth ?? {} };
}

const failures = [];
const warnings = [];

for (const env of ENVIRONMENTS) {
  for (const service of AUTH_USING_SERVICES) {
    const { file, auth } = readAuthConfig(service, env);

    for (const key of AUTH_KEYS) {
      const value = auth[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        failures.push(
          `[${env}] ${service}: auth.${key} is missing or not a finite number (${file})`,
        );
      }
    }
  }
}

for (const env of ENVIRONMENTS) {
  const authSvc = readAuthConfig('auth-service', env);
  const gateway = readAuthConfig('gateway', env);

  const jwtExpiresIn = authSvc.auth.jwtExpiresIn;
  const jwtRefreshFallbackSeconds = gateway.auth.jwtRefreshFallbackSeconds;
  const jwtRefreshWindowPercentage = gateway.auth.jwtRefreshWindowPercentage;

  if (
    Number.isInteger(jwtRefreshFallbackSeconds) &&
    Number.isInteger(jwtExpiresIn)
  ) {
    if (jwtRefreshFallbackSeconds >= jwtExpiresIn) {
      failures.push(
        `[${env}] auth.jwtRefreshFallbackSeconds (${jwtRefreshFallbackSeconds}) must be < auth.jwtExpiresIn (${jwtExpiresIn}). ` +
          `When the fallback covers the token's whole lifetime, ExpiryPolicy marks every request as refresh-due. ` +
          `LATENT, NOT LIVE: auth.service.ts signs without noTimestamp, so jsonwebtoken adds iat and the fallback branch is unreachable today. ` +
          `It becomes live the moment any flow issues a token without iat. ` +
          `Files: ${gateway.file}, ${authSvc.file}`,
      );
    }

    const derivedWindowSeconds = Math.floor(
      jwtExpiresIn * jwtRefreshWindowPercentage,
    );

    if (jwtRefreshFallbackSeconds !== derivedWindowSeconds) {
      warnings.push(
        `[warn] [${env}] auth.jwtRefreshFallbackSeconds (${jwtRefreshFallbackSeconds}) differs from ` +
          `floor(auth.jwtExpiresIn * auth.jwtRefreshWindowPercentage) (${derivedWindowSeconds}). ` +
          `Expected while auth-service issues access tokens at jwtExpiresIn (auth.service.ts). ` +
          `Revisit if a shorter-lived token (step-up/re-auth) is introduced.`,
      );
    }
  }
}

for (const warning of warnings) {
  console.warn(warning);
}

if (failures.length > 0) {
  console.error('session config contract check failed:\n');
  for (const failure of failures) {
    console.error(`  ${failure}\n`);
  }
  process.exit(1);
}

console.log(
  `session config contract check passed (${ENVIRONMENTS.length} environments, ${AUTH_USING_SERVICES.length} auth-using services)`,
);
