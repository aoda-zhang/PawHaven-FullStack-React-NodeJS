import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';

import { cn } from '../../utils/cn';

export const notificationType = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
} as const;

export type ToastType = keyof typeof notificationType;

export interface ToastItem {
  id: string;
  type: ToastType;
  message: ReactNode;
  duration: number;
}

export interface ShowToastInput {
  type?: ToastType;
  message: ReactNode;
  duration?: number;
  id?: string;
}

const DEFAULT_DURATION = 3000;

let items: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, number>();
let counter = 0;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => items;

const emit = () => {
  listeners.forEach((listener) => listener());
};

const clearTimer = (id: string) => {
  const timer = timers.get(id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timers.delete(id);
  }
};

const dismissToast = (id: string) => {
  items = items.filter((item) => item.id !== id);
  emit();
};

export function showToast({
  type = notificationType.info,
  message,
  duration = DEFAULT_DURATION,
  id,
}: ShowToastInput) {
  const toastId = id ?? `toast-${Date.now()}-${counter}`;
  counter += 1;
  clearTimer(toastId);
  const safeDuration =
    Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_DURATION;
  items = [
    ...items.filter((item) => item.id !== toastId),
    { id: toastId, type, message, duration: safeDuration },
  ];
  emit();
  timers.set(
    toastId,
    window.setTimeout(() => {
      timers.delete(toastId);
      dismissToast(toastId);
    }, safeDuration),
  );
}

const iconByType: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toneByType: Record<ToastType, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

export const Toast = () => {
  const toasts = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div
      className="pointer-events-none fixed top-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = iconByType[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            className="border-border bg-background/90 shadow-toast pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 backdrop-blur-md"
          >
            <Icon
              className={cn('mt-0.5 size-5 shrink-0', toneByType[toast.type])}
            />
            <div className="text-text flex-1 text-sm">{toast.message}</div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => {
                clearTimer(toast.id);
                dismissToast(toast.id);
              }}
              className="text-text-muted hover:text-text shrink-0 rounded p-0.5 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
