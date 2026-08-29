import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../utils/cn';

export interface BannerMessage {
  id: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
  dismissible?: boolean;
  variant?: 'standard' | 'filled' | 'outlined';
  bannerWrapClassNames?: string;
}

const iconByType: Record<NonNullable<BannerMessage['type']>, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle2,
};

const toneByType: Record<
  NonNullable<BannerMessage['type']>,
  { icon: string; container: string }
> = {
  info: {
    icon: 'text-info',
    container: 'border-info/40 bg-info/10',
  },
  warning: {
    icon: 'text-warning',
    container: 'border-warning/40 bg-warning/10',
  },
  error: {
    icon: 'text-error',
    container: 'border-error/40 bg-error/10',
  },
  success: {
    icon: 'text-success',
    container: 'border-success/40 bg-success/10',
  },
};

export const NotificationBanner = ({ banner }: { banner: BannerMessage }) => {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const type = banner.type ?? 'info';
  const Icon = iconByType[type];
  const tone = toneByType[type];
  const filled = banner.variant === 'filled';
  const outlined = banner.variant === 'outlined';

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start justify-start gap-3 border-b px-4 py-4 text-left text-sm lg:px-20',
        tone.container,
        outlined && 'border-l-4',
        filled && 'bg-primary/90 text-primary-fg',
        banner.bannerWrapClassNames,
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-5 shrink-0',
          filled ? 'text-current' : tone.icon,
        )}
      />
      <div className="flex-1">
        {banner.title && (
          <p className="mb-1 text-lg font-semibold">{banner.title}</p>
        )}
        <p>{banner.message}</p>
        {banner.linkText && banner.linkUrl && (
          <a
            href={banner.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {banner.linkText}
          </a>
        )}
      </div>
      {banner.dismissible && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => setOpen(false)}
          className="hover:bg-background/20 shrink-0 rounded p-0.5 transition-colors"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};
