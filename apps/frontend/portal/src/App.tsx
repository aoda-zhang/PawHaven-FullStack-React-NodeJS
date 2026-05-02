import type { FC } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Landing } from './features/Landing';
import { AppProvider } from './providers/AppProvider';
import { AppRouterProvider } from './router/AppRouterProvider';

export const App: FC = () => {
  return (
    <AppProvider>
      <Landing>
        <AppRouterProvider />
      </Landing>
      <ToastContainer position="top-right" autoClose={3000} />
    </AppProvider>
  );
};
