import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../utils/cn';

export type BannerType = 'info' | 'warning' | 'error' | 'success';

export type BannerVariant = 'standard' | 'fill' | 'accent';

export interface BannerLink {
  text: string;
  href: string;
}

export interface BannerMessage {
  id?: string;
  type?: BannerType;
  title?: string;
  message: string;
  link?: BannerLink;
  dismissible?: boolean;
  variant?: BannerVariant;
  bannerWrapClassNames?: string;
}

const iconByType: Record<BannerType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle2,
};

const toneByType: Record<
  BannerType,
  { icon: string; container: string; role: 'alert' | 'status' }
> = {
  info: {
    icon: 'text-info',
    container: 'border-info/40 bg-info/10',
    role: 'status',
  },
  warning: {
    icon: 'text-warning',
    container: 'border-warning/40 bg-warning/10',
    role: 'alert',
  },
  error: {
    icon: 'text-error',
    container: 'border-error/40 bg-error/10',
    role: 'alert',
  },
  success: {
    icon: 'text-success',
    container: 'border-success/40 bg-success/10',
    role: 'status',
  },
};

export const NotificationBanner = ({ banner }: { banner: BannerMessage }) => {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const { type = 'info', variant = 'standard', link } = banner;
  const Icon = iconByType[type];
  const tone = toneByType[type];

  return (
    <div
      id={banner.id}
      role={tone.role}
      className={cn(
        'flex items-start justify-start gap-3 border-b px-4 py-4 text-left text-sm lg:px-20',
        tone.container,
        variant === 'accent' && 'border-l-4',
        variant === 'fill' && 'bg-primary/90 text-primary-fg',
        banner.bannerWrapClassNames,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 size-5 shrink-0',
          variant === 'fill' ? 'text-current' : tone.icon,
        )}
      />
      <div className="flex-1">
        {banner.title && (
          <p className="mb-1 text-lg font-semibold">{banner.title}</p>
        )}
        <p>{banner.message}</p>
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {link.text}
            <ExternalLink className="ml-1 inline size-4" aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
      {banner.dismissible && (
        <button
          type="button"
          aria-label={
            banner.title ? `Dismiss ${banner.title}` : 'Dismiss notification'
          }
          onClick={() => setOpen(false)}
          className="hover:bg-background/20 shrink-0 rounded p-0.5 transition-colors"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
};
