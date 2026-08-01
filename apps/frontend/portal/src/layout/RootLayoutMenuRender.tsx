import { cn } from '@pawhaven/frontend-core';
import { BookOpen, FileText, Heart, House } from 'lucide-react';

import { useMenuNavigation } from './hooks/useMenuNavigation';

import { type MenuRenderType } from '@/features/Landing/landing.type';

const NAV_ICONS: Record<string, typeof House> = {
  '/rescues': House,
  '/adopt': Heart,
  '/knowledge': BookOpen,
  '/stories': FileText,
};

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
    <div className={cn('flex flex-col gap-3 md:flex-row md:gap-1', className)}>
      {resolvedItems.map((item) => {
        const Icon = NAV_ICONS[item.to];
        return (
          <button
            type="button"
            className={item.className}
            key={item.label}
            onClick={() => handleMenuClick(item)}
            aria-current={activePath === item.to ? 'page' : undefined}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
