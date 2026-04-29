import { LanguageSelector } from '@pawhaven/frontend-core';
import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { Brand } from '@/components/Brand';

export const AuthLayout: FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-hidden px-3 py-3 sm:px-6 sm:py-5">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <div className="flex w-full items-center gap-4">
          <Brand navigate={navigate} />
          <div className="ml-auto shrink-0 [&>div]:!mb-0 [&>div]:!min-w-fit [&>div]:px-3 [&>div]:py-1 [&>div]:text-sm">
            <LanguageSelector />
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 items-center justify-center">
          <div className="w-full max-w-[30rem] rounded-2xl border border-border bg-white px-5 py-6 shadow-lg sm:px-8 sm:py-7 sm:shadow-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
