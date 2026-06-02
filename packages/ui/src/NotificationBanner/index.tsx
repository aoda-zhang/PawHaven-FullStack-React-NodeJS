import { Alert, AlertTitle, Link, Collapse, IconButton } from '@mui/material';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useState } from 'react';

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

export const NotificationBanner = ({ banner }: { banner: BannerMessage }) => {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <Collapse in={open}>
      <Alert
        severity={banner.type ?? 'info'}
        variant={banner?.variant ?? 'standard'}
        className={clsx([
          'bg-info justify-start rounded-none px-4 py-4 text-left text-[0.95rem] lg:px-20',
          banner?.bannerWrapClassNames,
        ])}
        sx={{ borderRadius: 0 }}
        action={
          banner.dismissible ? (
            <IconButton size="small" onClick={() => setOpen(false)}>
              <X />
            </IconButton>
          ) : null
        }
      >
        {banner.title && (
          <AlertTitle className="text-left text-2xl">{banner.title}</AlertTitle>
        )}
        <p className="text-left">{banner.message}</p>
        {banner.linkText && banner.linkUrl && (
          <>
            <Link href={banner.linkUrl} target="_blank" underline="hover">
              {banner.linkText}
            </Link>
          </>
        )}
      </Alert>
    </Collapse>
  );
};
