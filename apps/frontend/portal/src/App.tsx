import { Landing } from './features/Landing';
import { AppProvider } from './providers/AppProvider';
import { AppRouterProvider } from './router/AppRouterProvider';

export const App = () => {
  return (
    <AppProvider>
      <Landing>
        <AppRouterProvider />
      </Landing>
    </AppProvider>
  );
};
