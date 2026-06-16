import type { MenuItem } from '@pawhaven/shared/types';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { useLogout } from '@/features/Auth/apis/queries';
import { type MenuRenderType } from '@/features/Landing/landing.type';
import { routePaths } from '@/router/routePaths';
import { useGlobalState } from '@/store/globalReducer';

const rootLayoutClassNames = {
  menuItem:
    'cursor-pointer flex justify-center items-center px-3 border-b border-border md:border-none hover:text-primary',
  activeMenuItem: 'block text-primary',
  login:
    'px-3 py-2 rounded-sm bg-primary text-text-inverse m-4 lg:m-0 flex justify-center items-center cursor-pointer',
};

export const RootLayoutMenuRender = (
  props: MenuRenderType & { className?: string },
) => {
  const { menuItems, activePath, navigate, className } = props;
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
      itemClassNames = [...itemClassNames, rootLayoutClassNames.activeMenuItem];
    }

    const handleClick = () => {
      if (item.to === routePaths.login && isLoggedIn && !isLogoutPending) {
        logout();
        return;
      }
      navigate(item.to || '/');
    };

    return (
      <button
        type="button"
        className={clsx(itemClassNames)}
        key={item.label}
        onClick={handleClick}
      >
        {t(item.label)}
      </button>
    );
  };

  return (
    <div className={clsx('flex', className)}>
      {menuItems?.map(handleLinkMenu)}
    </div>
  );
};
