export const runtimeEnv = {
  dev: 'dev',
  development: 'dev',
  uat: 'uat',
  test: 'test',
  prod: 'prod',
  production: 'prod',
};

export type RuntimeEnvType = keyof typeof runtimeEnv;
