import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/react-vite';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(configDirectory, '../../..');

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(viteConfig) {
    viteConfig.base = process.env.STORYBOOK_BASE_PATH ?? viteConfig.base;
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    viteConfig.resolve ??= {};
    viteConfig.resolve.dedupe = [
      ...(viteConfig.resolve.dedupe ?? []),
      'react',
      'react-dom',
    ];
    viteConfig.resolve.alias = [
      ...(Array.isArray(viteConfig.resolve.alias)
        ? viteConfig.resolve.alias
        : Object.entries(viteConfig.resolve.alias ?? {}).map(([find, replacement]) => ({
            find,
            replacement: String(replacement),
          }))),
      {
        find: '@pawhaven/design-system/index.css',
        replacement: path.join(repositoryRoot, 'packages/design-system/index.css'),
      },
    ];
    return viteConfig;
  },
};

export default config;
