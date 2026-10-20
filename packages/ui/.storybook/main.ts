import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(configDirectory, '../../..');

/** The directory of an installed package, so Storybook resolves one copy. */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-vitest'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.base = process.env.STORYBOOK_BASE_PATH ?? viteConfig.base;
    viteConfig.define = { ...viteConfig.define, global: 'globalThis' };
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    viteConfig.resolve ??= {};
    viteConfig.resolve.dedupe = [
      ...(viteConfig.resolve.dedupe ?? []),
      'react',
      'react-dom',
      'react-hook-form',
    ];
    viteConfig.resolve.alias = [
      ...(Array.isArray(viteConfig.resolve.alias)
        ? viteConfig.resolve.alias
        : Object.entries(viteConfig.resolve.alias ?? {}).map(
            ([find, replacement]) => ({
              find,
              replacement: String(replacement),
            }),
          )),
      {
        find: '@pawhaven/design-system/index.css',
        replacement: path.join(
          repositoryRoot,
          'packages/design-system/index.css',
        ),
      },
    ];
    return viteConfig;
  },
};

export default config;
