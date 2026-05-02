import type { FC } from 'react';

import { Landing } from './features/Landing';
import { AppProvider } from './providers/AppProvider';
import { AppRouterProvider } from './router/AppRouterProvider';

export const App: FC = () => {
  return (
    <AppProvider>
      <Landing>
        <AppRouterProvider />
      </Landing>
    </AppProvider>
  );
};
