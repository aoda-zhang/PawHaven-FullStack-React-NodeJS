import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

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

const isAssertiveType = (type: ToastType) =>
  type === notificationType.error || type === notificationType.warning;

let activeHost: symbol | null = null;
const hostListeners = new Set<() => void>();

const claimHost = (hostId: symbol): boolean => {
  if (activeHost === null) {
    activeHost = hostId;
    return true;
  }
  return activeHost === hostId;
};

const useToastHost = (): boolean => {
  const [hostId] = useState(() => Symbol('toast-host'));

  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const sync = () => setIsHost(claimHost(hostId));
    sync();
    hostListeners.add(sync);
    return () => {
      hostListeners.delete(sync);
      if (activeHost === hostId) {
        activeHost = null;
        hostListeners.forEach((listener) => listener());
      }
    };
  }, [hostId]);

  return isHost;
};

interface ToastEntryProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastEntry = ({ toast, onDismiss }: ToastEntryProps) => {
  const Icon = iconByType[toast.type];
  const containerRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const assertive = isAssertiveType(toast.type);

  useEffect(() => {
    if (!assertive) return undefined;

    const container = containerRef.current;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dismissRef.current?.focus();

    return () => {
      const active = document.activeElement;
      const focusIsInside =
        active instanceof HTMLElement && container?.contains(active) === true;
      if (focusIsInside || active === null || active === document.body) {
        restoreFocusRef.current?.focus();
      }
    };
  }, [assertive]);

  return (
    <div
      ref={containerRef}
      role={assertive ? 'alert' : 'status'}
      className="border-border bg-background/90 shadow-toast rounded-panel pointer-events-auto flex items-start gap-3 border px-4 py-3 backdrop-blur-md"
    >
      <Icon
        aria-hidden="true"
        className={cn('mt-0.5 size-5 shrink-0', toneByType[toast.type])}
      />
      <div className="text-text flex-1 text-sm">{toast.message}</div>
      <button
        ref={dismissRef}
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="text-text-secondary hover:text-text shrink-0 rounded p-0.5 transition-colors"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
};

export const Toast = () => {
  const toasts = useSyncExternalStore(subscribe, getSnapshot);
  const isHost = useToastHost();

  if (!isHost) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="z-toast pointer-events-none fixed top-4 left-1/2 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2"
    >
      <div
        aria-live="polite"
        aria-atomic="false"
        className="flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastEntry
            key={toast.id}
            toast={toast}
            onDismiss={(id) => {
              clearTimer(id);
              dismissToast(id);
            }}
          />
        ))}
      </div>
    </div>
  );
};
