import { AppProvider } from './providers/AppProvider';
import { AppRouterProvider } from './providers/AppRouterProvider';

export const App = () => {
  return (
    <AppProvider>
      <AppRouterProvider />
    </AppProvider>
  );
};
