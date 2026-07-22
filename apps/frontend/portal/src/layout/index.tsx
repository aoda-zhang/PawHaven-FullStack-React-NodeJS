import { Loading, NotificationBanner, Toast } from '@pawhaven/ui';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useMenuVisibility } from './hooks/useMenuVisibility';
import { RootLayoutFooter } from './RootLayoutFooter';
import { RootLayoutMenu } from './RootLayoutMenu';

import { useLandingContext } from '@/features/Landing/landingContext';
import { useGlobalState } from '@/store/globalReducer';

export const RootLayout = () => {
  const { isSysMaintain } = useGlobalState();
  const { menus } = useLandingContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isMenuAvailable, isFooterAvailable } = useMenuVisibility();
  const { pathname } = useLocation();

  return (
    <div className="overflow-x-hidden">
      <header className="z-sticky border-border bg-background/88 sticky top-0 border-b backdrop-blur-md">
        <Toast />
        {isSysMaintain && (
          <NotificationBanner
            banner={{
              id: 'system-maintenance',
              type: 'info',
              variant: 'filled',
              message: t('common.mockDataWarning'),
              dismissible: false,
            }}
          />
        )}
        {isMenuAvailable && (
          <RootLayoutMenu
            menuItems={menus}
            navigate={navigate}
            activePath={pathname}
          />
        )}
      </header>

      <main className="flex flex-1 flex-col">
        <div className="flex-1 px-4 lg:px-28">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </div>
        {isFooterAvailable && (
          <footer>
            <RootLayoutFooter />
          </footer>
        )}
      </main>
    </div>
  );
};
