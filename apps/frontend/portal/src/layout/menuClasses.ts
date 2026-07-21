export const MENU_CLASSES = {
  menuItem:
    'cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted',
  activeMenuItem: 'bg-accent text-primary',
  login:
    'px-3 py-2 rounded-lg bg-primary text-white font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors hover:bg-primary/90',
} as const;

export type MenuClassKey = keyof typeof MENU_CLASSES;
