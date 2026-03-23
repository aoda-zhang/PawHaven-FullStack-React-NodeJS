import type { MenuItem } from '@pawhaven/shared/types';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { useLogout } from '@/features/Auth/apis/queries';
import { type MenuRenderType } from '@/features/Landing/landing.type';
import { routePaths } from '@/router/routePaths';
import { useGlobalState } from '@/store/globalReducer';

const rootLayoutClassNames = {
  menuItem:
    'cursor-pointer flex justify-center items-center p-sm border-b border-border md:border-none hover:text-primary',
  activeMenuItem: 'block text-primary',
  login:
    'px-3 py-2 rounded-sm bg-primary text-white m-4 lg:m-0 flex justify-center items-center cursor-pointer',
};
export const RootLayoutMenuRender = (props: MenuRenderType) => {
  const { menuItems, activePath, navigate } = props;
  const { t } = useTranslation();
  const { profile } = useGlobalState();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const isLoggedIn = !!profile?.baseUserInfo?.userID;

  const handleLinkMenu = (item: MenuItem) => {
    const isActiveMenuItem = activePath === item.to;
    let itemClassNames = [
      rootLayoutClassNames[
        item?.classNames as unknown as keyof typeof rootLayoutClassNames
      ] ?? '',
    ];
    if (isActiveMenuItem) {
      // Active the current menu
      itemClassNames = [...itemClassNames, rootLayoutClassNames.activeMenuItem];
    }
    return (
      <div
        className={clsx(itemClassNames)}
        key={item.label}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (item.to === routePaths.login && isLoggedIn && !isLogoutPending) {
            logout();
            return;
          }
          navigate(item.to || '/');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (
              item.to === routePaths.login &&
              isLoggedIn &&
              !isLogoutPending
            ) {
              logout();
              return;
            }
            navigate(item.to || '/');
          }
        }}
      >
        {t(item.label)}
      </div>
    );
  };

  return menuItems?.map(handleLinkMenu);
};
