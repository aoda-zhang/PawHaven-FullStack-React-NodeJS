export type MicroServiceOptions = {
  host?: string;
  port?: number;
  gatewayPrefix?: string;
  pathRewrite?: string;
};

export type MicroServiceConfig = {
  name?: string;
  enable?: boolean;
  options?: MicroServiceOptions;
};
