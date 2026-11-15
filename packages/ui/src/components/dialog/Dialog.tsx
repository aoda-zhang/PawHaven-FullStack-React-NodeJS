import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

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
  open, onOpenChange, title, description, children, footer, closeLabel,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className="fixed inset-0 m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-card-large border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-foreground/50"
    >
      <div className="space-y-5 p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {description && <p id={descriptionId} className="text-text-secondary text-sm leading-6">{description}</p>}
          </div>
          {closeLabel && (
            <Button type="button" variant="ghost" size="icon" aria-label={closeLabel} onClick={() => onOpenChange(false)}>
              <X aria-hidden="true" className="size-4" />
            </Button>
          )}
        </header>
        {children && <div>{children}</div>}
        {footer && <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</footer>}
      </div>
    </dialog>
  );
};