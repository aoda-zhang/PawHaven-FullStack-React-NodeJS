import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexPath = resolve('tools/ui-storybook/storybook-static/index.json');
const index = JSON.parse(readFileSync(indexPath, 'utf8'));
const entries = Object.values(index.entries ?? index.stories ?? {});
const storyNames = entries
  .map((entry) => `${entry.title ?? ''} ${entry.name ?? ''}`.toLowerCase())
  .join('\n');

const requiredStories = [
  'button variants',
  'button sizes',
  'button states',
  'filedownloadbutton',
  'loading',
  'skeleton',
  'photoplaceholder',
  'phase',
  'timeline compound components',
  'phoneinput',
  'notification banner',
  'notification banner variants',
  'toast',
  'carousel',
  'all form components',
  'password field',
];

const missing = requiredStories.filter((story) => !storyNames.includes(story));

if (missing.length > 0) {
  console.error('Storybook is missing expected component stories:', missing.join(', '));
  process.exit(1);
}

console.log(`Verified ${requiredStories.length} required Storybook component stories.`);
