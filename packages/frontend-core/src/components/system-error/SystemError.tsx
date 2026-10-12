import { Button } from '@pawhaven/ui';
import { Copy, Home, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { getLastTraceId } from '../../api/trace';
import { cn } from '../../utils/cn';
import type { ErrorInfo } from '../router-error-fallback/RouterErrorFallback';

const handleGoHome = () => {
  window.location.href = '/';
};

const retry = () => {
  window.location.reload();
};

/**
 * Copies the reference id to the clipboard. The Clipboard API is unavailable
 * in insecure contexts and can reject on permission, so failure is swallowed —
 * the id is on screen either way and can be selected by hand.
 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard?.writeText(text);
  } catch {
    // Nothing useful to do; the user can still read the id off the screen.
  }
};

interface SystemErrorProps {
  error?: Partial<ErrorInfo> & { traceId?: string | null };
  footer?: ReactNode;
}

export const SystemError = ({ error, footer }: SystemErrorProps) => {
  const { t } = useTranslation();
  // Prefer the id carried by the error itself, falling back to the last one the
  // API client saw — a render error boundary is often several requests removed
  // from the failure, so the module-level value is frequently the better clue.
  const traceId = error?.traceId ?? getLastTraceId();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-background flex w-full flex-1 flex-col px-5 pt-10 pb-10 text-center">
        <div className="mb-10">
          <div className="bg-error-light text-error mx-auto inline-flex size-28 items-center justify-center rounded-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-16"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <div className="mx-auto mb-12 max-w-xl">
          <h1 className="text-text mb-4 text-4xl leading-tight font-bold">
            {t('common.system_error')}
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            {t('common.system_error_info')}
          </p>

          {traceId ? (
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-text-secondary text-sm">
                {t('common.error_trace_id')}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(traceId)}
                title={t('common.error_trace_id_copy')}
                className="text-text-secondary hover:text-text inline-flex items-center gap-2 font-mono text-xs break-all transition-colors"
              >
                {traceId}
                <Copy size={14} className="shrink-0" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={retry}
            className={cn('rounded-xl px-8 py-3 text-base font-semibold')}
          >
            <RotateCw size={18} />
            {t('common.retry', 'Try Again')}
          </Button>
          <Button
            variant="outline"
            onClick={handleGoHome}
            className={cn('rounded-xl px-8 py-3 text-base font-semibold')}
          >
            <Home size={18} />
            {t('common.go_to_home', 'Go Home')}
          </Button>
        </div>
      </div>

      {footer}
    </div>
  );
};
