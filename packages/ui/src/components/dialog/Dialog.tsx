import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

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
}: DialogProps) => {
  const openerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-foreground/50 fixed inset-0 z-50" />
        <DialogPrimitive.Content
          className="rounded-dialog border-border bg-card text-foreground shadow-modal fixed top-1/2 left-1/2 z-50 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-96 -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-0"
          onCloseAutoFocus={() => {
            const opener = openerRef.current;
            if (opener?.isConnected) opener.focus({ preventScroll: true });
          }}
        >
          <div className="space-y-5 p-5">
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
              <footer className="flex flex-wrap-reverse justify-end gap-2">
                {footer}
              </footer>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
