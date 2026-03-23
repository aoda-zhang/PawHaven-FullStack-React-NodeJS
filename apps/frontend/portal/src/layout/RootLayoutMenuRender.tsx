import { I18nSwitch } from '@pawhaven/frontend-core';
import type { MenuItem } from '@pawhaven/shared/types';
import clsx from 'clsx';
import { cloneElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useLogout } from '@/features/Auth/apis/queries';
import {
  menuTypes,
  type MenuRenderType,
} from '@/features/Landing/landing.type';
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
  const HeaderComponentMappings = {
    I18nSwitch: (
      <div className="shrink-0 rounded-full border border-border bg-white px-1 py-1 shadow-sm [&>div]:!mb-0 [&>div]:!min-w-fit [&>div]:px-3 [&>div]:py-1 [&>div]:text-sm">
        <I18nSwitch />
      </div>
    ),
  };
  const { menuItems, activePath, navigate } = props;
  const { t } = useTranslation();
  const { profile } = useGlobalState();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const isLoggedIn = !!profile?.baseUserInfo?.userID;

  const handleLinkMenu = (item: MenuItem) => {
    if (item?.to) {
      const isActiveMenuItem =
        item.type === menuTypes.link && activePath === item?.to;
      let itemClassNames = [
        rootLayoutClassNames[
          item?.classNames as unknown as keyof typeof rootLayoutClassNames
        ] ?? '',
      ];
      if (isActiveMenuItem) {
        // Active the current menu
        itemClassNames = [
          ...itemClassNames,
          rootLayoutClassNames.activeMenuItem,
        ];
      }
      return (
        <div
          className={clsx(itemClassNames)}
          key={item.label}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (
              item.to === routePaths.login &&
              isLoggedIn &&
              !isLogoutPending
            ) {
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
    }
    return null;
  };

  const handleComponentMenu = (item: MenuItem) => {
    if (item?.component) {
      const itemClassNames = item?.classNames ?? [];
      const Component =
        HeaderComponentMappings[
          item.component as unknown as keyof typeof HeaderComponentMappings
        ];
      return (
        <div className={clsx(itemClassNames)} key={item?.label}>
          {Component && cloneElement(Component)}
        </div>
      );
    }
    return null;
  };

  return menuItems?.map((item) => {
    switch (item.type) {
      case menuTypes.link:
        return handleLinkMenu(item);
      case menuTypes.component:
        return handleComponentMenu(item);
      default:
        return null;
    }
  });
};
