export const runtimeEnv = {
  dev: 'dev',
  uat: 'uat',
  test: 'test',
  prod: 'prod',
};

export type RuntimeEnvType = keyof typeof runtimeEnv;
