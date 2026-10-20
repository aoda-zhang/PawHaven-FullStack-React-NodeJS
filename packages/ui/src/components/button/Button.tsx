import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed focus-ring [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-fg hover:bg-primary-active',
        destructive: 'bg-error text-text-inverse hover:bg-error/90',
        outline:
          'border border-border bg-background text-text hover:bg-muted hover:text-text',
        secondary: 'bg-muted text-text hover:bg-muted-strong',
        ghost: 'hover:bg-muted hover:text-text',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-md px-3 has-[>svg]:px-2.5',
        md: 'h-10 px-4 py-2 has-[>svg]:px-3',
        lg: 'h-11 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-10 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps
  extends
    React.ComponentProps<'button'>,
    Omit<VariantProps<typeof buttonVariants>, 'size'> {
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
}

export const Button = ({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  onClickCapture,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : 'button';
  const isUnavailable = Boolean(disabled || loading);

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : isUnavailable}
      aria-disabled={asChild && isUnavailable ? true : props['aria-disabled']}
      aria-busy={loading || undefined}
      onClickCapture={(event) => {
        if (asChild && isUnavailable) {
          event.preventDefault();
          event.stopPropagation();
        }

        onClickCapture?.(event);
      }}
      {...props}
    >
      {loading && (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      )}
      {asChild ? <Slottable>{children}</Slottable> : children}
    </Comp>
  );
};
