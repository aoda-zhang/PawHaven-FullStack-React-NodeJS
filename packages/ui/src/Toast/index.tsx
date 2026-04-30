import designTokens from '@pawhaven/design-tokens/designTokens';
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
        backgroundColor: designTokens.colors.surface,
        color: designTokens.colors.textPrimary,
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
            backgroundColor: designTokens.colors.surface,
            color: designTokens.colors.success,
          },
          iconTheme: success?.iconTheme ?? {
            primary: designTokens.colors.success,
            secondary: designTokens.colors.surface,
          },
        },
        error: {
          position: error?.position ?? 'top-center',
          duration: error?.duration ?? Infinity,
          style: error?.style ?? {
            backgroundColor: designTokens.colors.error,
            color: designTokens.colors.surface,
          },
          iconTheme: error?.iconTheme ?? {
            primary: designTokens.colors.surface,
            secondary: designTokens.colors.error,
          },
        },
      }}
    />
  );
};
