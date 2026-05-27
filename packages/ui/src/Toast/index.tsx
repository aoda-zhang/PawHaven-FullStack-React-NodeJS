import type { ReactElement } from 'react';
import React from 'react';
import type { ToastOptions } from 'react-hot-toast';
import toast, { Toaster } from 'react-hot-toast';

export const notificationType = {
  success: 'success',
  error: 'error',
  info: 'info',
} as const;

export type ToastType = keyof typeof notificationType;
export interface NotificationProps {
  success?: ToastOptions;
  error?: ToastOptions;
  info?: ToastOptions;
}

interface ShowNotificationProps {
  type?: ToastType;
  message: string | ReactElement;
  notificationOption?: ToastOptions;
}

export const showToast = ({
  type = notificationType.info,
  message,
  notificationOption,
}: ShowNotificationProps) => {
  const globalNotificationID = 'PAWHAVEN_NOTIFICATION';
  if (type === notificationType.success || type === notificationType.error) {
    toast.dismiss(globalNotificationID);
    toast?.[type](message, {
      id: globalNotificationID,
      duration: notificationOption?.duration ?? 3000,
      ...(notificationOption ?? {}),
    });
  }
  if (type === notificationType.info) {
    toast(message, {
      id: globalNotificationID,
      duration: notificationOption?.duration ?? 3000,
      style: notificationOption?.style ?? {
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
      },
      ...(notificationOption ?? {}),
    });
  }
};

export const Toast: React.FC<NotificationProps> = ({ success, error }) => {
  return (
    <Toaster
      toastOptions={{
        style: {
          maxWidth: '31.25rem',
          padding: '1rem',
        },
        success: {
          position: success?.position ?? 'top-center',
          duration: success?.duration ?? 2500,
          style: success?.style ?? {
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-success-500)',
          },
          iconTheme: success?.iconTheme ?? {
            primary: 'var(--color-success-500)',
            secondary: 'var(--color-surface)',
          },
        },
        error: {
          position: error?.position ?? 'top-center',
          duration: error?.duration ?? Infinity,
          style: error?.style ?? {
            backgroundColor: 'var(--color-error-500)',
            color: 'var(--color-surface)',
          },
          iconTheme: error?.iconTheme ?? {
            primary: 'var(--color-surface)',
            secondary: 'var(--color-error-500)',
          },
        },
      }}
    />
  );
};
