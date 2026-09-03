import { cn } from '@pawhaven/frontend-core';

import type { MenuItemType } from '@/types/LayoutType';

interface SidebarMenuItemProps {
  item: MenuItemType & { className: string };
  onClick: (to: string) => void;
}

export const SidebarMenuItem = ({ item, onClick }: SidebarMenuItemProps) => {
  const isAuth = (item.classNames as string[]).some(
    (c) => c === 'login' || c === 'logout',
  );

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-xl px-4 py-3 text-base font-medium transition-colors',
        item.className,
        isAuth && 'justify-center',
      )}
      onClick={() => onClick(item.to)}
    >
      <span>{item.label}</span>
    </button>
  );
};
