import { X } from 'lucide-react';
import { ScrollRestoration, useNavigate } from 'react-router-dom';

import { routePaths } from '@/router/routePaths';

const CloseButton = ({ iconClassName }: { iconClassName: string }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(routePaths.home)}
      className="text-text-secondary hover:text-text focus-ring cursor-pointer transition-colors"
    >
      <X className={iconClassName} />
    </button>
  );
};

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-surface flex h-dvh flex-col overflow-hidden sm:items-center sm:justify-center">
      <ScrollRestoration />

      <div className="flex h-14 shrink-0 items-center justify-end px-4 sm:hidden">
        <CloseButton iconClassName="size-6" />
      </div>

      <div className="bg-surface sm:border-border sm:shadow-modal flex min-h-0 w-full flex-1 flex-col sm:max-h-[calc(100dvh-4rem)] sm:max-w-[28rem] sm:flex-none sm:rounded-lg sm:border">
        <div className="hidden shrink-0 justify-end pt-4 pr-4 sm:flex">
          <CloseButton iconClassName="size-5" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-10 sm:px-8 sm:pt-1 sm:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};
