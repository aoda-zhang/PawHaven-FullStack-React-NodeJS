import { cn } from '@pawhaven/frontend-core';

import { useMenuNavigation } from './hooks/useMenuNavigation';

import { type MenuRenderType } from '@/features/Landing/landing.type';

export const RootLayoutMenuRender = (
  props: MenuRenderType & { className?: string },
) => {
  const { menuItems, activePath = '', navigate, className } = props;
  const { resolvedItems, handleMenuClick } = useMenuNavigation({
    menuItems,
    activePath,
    navigate,
  });

  return (
    <div className={cn('flex gap-1', className)}>
      {resolvedItems.map((item) => (
        <button
          type="button"
          className={item.className}
          key={item.label}
          onClick={() => handleMenuClick(item)}
          aria-current={activePath === item.to ? 'page' : undefined}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
