import { Button } from '@pawhaven/ui';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollRestoration, useNavigate } from 'react-router-dom';

import { routePaths } from '@/app/router/routePaths';

const CloseButton = ({ iconClassName }: { iconClassName: string }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Button
      size="icon"
      variant="ghost"
      type="button"
      onClick={() => navigate(routePaths.home)}
      aria-label={t('common.close')}
      className="text-text-secondary hover:text-text"
    >
      <X className={iconClassName} aria-hidden="true" />
    </Button>
  );
};

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-surface flex h-dvh flex-col overflow-hidden sm:items-center sm:justify-center">
      <ScrollRestoration />

      <div className="px-card flex h-14 shrink-0 items-center justify-end sm:hidden">
        <CloseButton iconClassName="size-6" />
      </div>

      <div className="bg-surface sm:border-border sm:shadow-modal sm:rounded-panel flex min-h-0 w-full flex-1 flex-col sm:max-h-[calc(100dvh-4rem)] sm:max-w-[28rem] sm:flex-none sm:border">
        <div className="pt-card pr-card hidden shrink-0 justify-end sm:flex">
          <CloseButton iconClassName="size-5" />
        </div>
        <div className="p-card min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
