import type { Preview } from '@storybook/react-vite';

import '../../../packages/ui/index.css';
import 'react-phone-number-input/style.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
    a11y: {
      test: 'error',
    },
  },
  globalTypes: {
    theme: {
      description: 'Preview theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => (
      <div
        className={context.globals.theme === 'dark' ? 'dark bg-background text-text min-h-40 p-6' : 'bg-background text-text min-h-40 p-6'}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
