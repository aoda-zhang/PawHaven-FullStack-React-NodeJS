import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '../button/Button';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}

export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel,
}: DialogProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
      <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card-large border border-border bg-card p-0 text-foreground shadow-xl">
        <div className="space-y-5 p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <DialogPrimitive.Title className="text-lg font-semibold">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-text-secondary text-sm leading-6">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {closeLabel && (
              <DialogPrimitive.Close asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={closeLabel}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </DialogPrimitive.Close>
            )}
          </header>
          {children && <div>{children}</div>}
          {footer && (
            <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {footer}
            </footer>
          )}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
