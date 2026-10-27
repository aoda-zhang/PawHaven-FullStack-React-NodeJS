import { Loading, NotificationBanner, Toast } from '@pawhaven/ui';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import {
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useNavigation,
} from 'react-router-dom';

import { useMenuVisibility } from './hooks/useMenuVisibility';
import { RootLayoutFooter } from './RootLayoutFooter';
import { RootLayoutMenu } from './RootLayoutMenu';

import { useBootstrapQuery } from '@/app/init/bootstrap.queries';
import type { BootstrapScope } from '@/app/init/bootstrap.queryKeys';
import { useGlobalContext } from '@/app/providers/GlobalProvider';
import { useGlobalState } from '@/app/store/globalReducer';
import { ContentFallback } from '@/shared/components/ContentFallback';

export const RootLayout = () => {
  const { isSysMaintain } = useGlobalState();
  const { userInfo } = useGlobalContext();
  const { isMenuAvailable, isFooterAvailable, isAuthPage } =
    useMenuVisibility();
  const scope: BootstrapScope = {
    userID: userInfo?.userId ?? '',
    menuUpdateAt: '',
  };
  const { data: bootstrapData } = useBootstrapQuery(scope, {
    enabled: !isAuthPage,
  });
  const menus = bootstrapData?.menus ?? [];
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigation = useNavigation();

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <ScrollRestoration />
      <Toast />
      {!isAuthPage && (
        <header className="z-sticky border-border bg-background/88 sticky top-0 border-b backdrop-blur-md">
          {isSysMaintain && (
            <NotificationBanner
              banner={{
                id: 'system-maintenance',
                type: 'info',
                variant: 'fill',
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
      )}

      <main
        className="flex flex-1 flex-col"
        aria-busy={navigation.state === 'loading'}
      >
        <Suspense fallback={<Loading />}>
          <div className="flex-1 px-4 lg:px-28">
            <ErrorBoundary FallbackComponent={ContentFallback} key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
          {isFooterAvailable && (
            <footer>
              <RootLayoutFooter />
            </footer>
          )}
        </Suspense>
      </main>
    </div>
  );
};
