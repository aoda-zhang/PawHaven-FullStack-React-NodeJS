import { Loading } from '@pawhaven/ui';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from '@/store/reduxStore';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};
