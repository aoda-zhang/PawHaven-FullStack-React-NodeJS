import { Loading, NotificationBanner, Toast } from '@pawhaven/ui';
import { Suspense, useEffect } from 'react';
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div>
      <header className="z-sticky border-border sticky top-0 border-b bg-[rgba(255,250,245,0.88)] backdrop-blur-[12px]">
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
        <div className="flex-1">
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
