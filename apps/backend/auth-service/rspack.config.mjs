import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';

import * as rspackApi from '@rspack/core';
import nodeExternals from 'webpack-node-externals';

const require = createRequire(import.meta.url);
const SERVICE_ROOT = import.meta.dirname;

const TSCONFIG_BASELINE = require.resolve('@pawhaven/tsconfig/node');

const buildAliases = () => {
  const { paths = {} } = require(
    path.join(SERVICE_ROOT, 'tsconfig.json'),
  ).compilerOptions;

  return Object.fromEntries(
    Object.entries(paths).map(([alias, [target]]) => [
      alias.replace(/\/\*$/, ''),
      path.resolve(SERVICE_ROOT, target.replace(/\/\*$/, '')),
    ]),
  );
};

const LAZY_OPTIONAL_IMPORTS = [
  '@nestjs/microservices',
  '@nestjs/microservices/microservices-module',
  '@nestjs/websockets/socket-module',
  '@nestjs/websockets/socket-module.js',
  'class-validator',
  'class-transformer',
  'class-transformer/storage',
  'amqp-connection-manager',
  'ioredis',
  'kafkajs',
  'mqtt',
  '@nats-io/transport-node',
];

const isInstalled = (request) => {
  try {
    require.resolve(request, { paths: [SERVICE_ROOT] });
    return true;
  } catch {
    return false;
  }
};

const externalizeNodeBuiltins = ({ request }, callback) => {
  if (!request) {
    return callback();
  }

  const bare = request.startsWith('node:') ? request.slice(5) : request;

  return builtinModules.includes(bare)
    ? callback(null, `module ${request}`)
    : callback();
};

export const externals = [
  nodeExternals({ importType: 'module' }),
  externalizeNodeBuiltins,
  { '@prismaClient/index.js': 'module ./prisma/mongodb/client/index.js' },
];

export const plugins = [
  new rspackApi.IgnorePlugin({
    checkResource: (resource) =>
      LAZY_OPTIONAL_IMPORTS.includes(resource) && !isInstalled(resource),
  }),
];

export const resolve = {
  extensions: ['.tsx', '.ts', '.js'],
  tsConfig: { configFile: TSCONFIG_BASELINE },
  plugins: [],
  alias: buildAliases(),
  extensionAlias: { '.js': ['.ts', '.js'], '.mjs': ['.mts', '.mjs'] },
};
