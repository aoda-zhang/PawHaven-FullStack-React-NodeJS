import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';

import * as rspackApi from '@rspack/core';
import nodeExternals from 'webpack-node-externals';

const require = createRequire(import.meta.url);
const SERVICE_ROOT = import.meta.dirname;

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
  tsConfig: { configFile: path.join(SERVICE_ROOT, 'tsconfig.json') },
  plugins: [],
  alias: buildAliases(),
  extensionAlias: {
    '.js': ['.ts', '.tsx', '.js'],
    '.mjs': ['.mts', '.mjs'],
  },
};

export const module = {
  rules: [
    {
      test: /\.tsx?$/,
      exclude: /node_modules/,
      type: 'javascript/esm',
      use: [
        {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
                react: {
                  runtime: 'automatic',
                },
              },
              target: 'es2021',
            },
          },
        },
      ],
    },
    {
      test: /pdf\.generated\.css$/,
      type: 'asset/source',
    },
    {
      test: /\.(png|jpe?g|gif|svg|webp|avif)$/,
      type: 'asset/inline',
    },
  ],
};
