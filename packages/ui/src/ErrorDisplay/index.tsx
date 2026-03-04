import designTokens from '@pawhaven/design-system/designTokens';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';
import type { ToastOptions } from 'react-hot-toast';
import toast from 'react-hot-toast';

/**
 * Error type enumeration for centralized error categorization
 */
export const errorType = {
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  AUTH: 'AUTH',
  PERMISSION: 'PERMISSION',
  VALIDATION: 'VALIDATION',
  RATE_LIMIT: 'RATE_LIMIT',
  MAINTENANCE: 'MAINTENANCE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = keyof typeof errorType;

/**
 * Display styles for error messages
 */
export const displayStyle = {
  toast: 'toast',
  banner: 'banner',
  modal: 'modal',
} as const;

export type DisplayStyle = keyof typeof displayStyle;

/**
 * Default error messages per error type
 */
const DEFAULT_ERROR_MESSAGES: Record<ErrorType, string> = {
  NETWORK: 'Network connection error. Please check your internet connection and try again.',
  SERVER: 'Server error occurred. Please try again later.',
  AUTH: 'Your session has expired. Please log in again.',
  PERMISSION: 'You do not have permission to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  MAINTENANCE: 'The service is temporarily under maintenance. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

export interface ErrorDisplayProps {
  errorType: ErrorType;
  message?: string | ReactElement;
  displayStyle?: DisplayStyle;
  onRetry?: () => void;
  onDismiss?: () => void;
  notificationOption?: ToastOptions;
}

export interface ShowErrorProps extends Omit<ErrorDisplayProps, 'displayStyle'> {
  displayStyle?: DisplayStyle;
}

/**
 * Renders error message with appropriate styling and actions
 */
const ErrorMessage: React.FC<{
  message: string | ReactElement;
  errorType: ErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ message, errorType, onRetry, onDismiss }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'inherit',
        }}
      >
        {typeof message === 'string' ? message : message}
      </div>
      {(onRetry || onDismiss) && (
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
          }}
        >
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Display error with toast notification (default style)
 */
const showErrorToast = (
  message: string | ReactElement,
  errorType: ErrorType,
  onRetry?: () => void,
  onDismiss?: () => void,
  notificationOption?: ToastOptions,
) => {
  const globalErrorID = `PAWHAVEN_ERROR_${errorType}`;

  toast.error(
    (t) => (
      <div
        onClick={() => {
          if (onDismiss) {
            onDismiss();
          }
          toast.dismiss(t.id);
        }}
        style={{ cursor: 'pointer' }}
      >
        <ErrorMessage
          message={message}
          errorType={errorType}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      </div>
    ),
    {
      id: globalErrorID,
      duration: notificationOption?.duration ?? Infinity,
      position: notificationOption?.position ?? 'top-center',
      style: notificationOption?.style ?? {
        backgroundColor: designTokens.colors.error,
        color: designTokens.colors.surface,
        maxWidth: '31.25rem',
        padding: '1rem',
      },
      iconTheme: notificationOption?.iconTheme ?? {
        primary: designTokens.colors.surface,
        secondary: designTokens.colors.error,
      },
      ...(notificationOption ?? {}),
    },
  );
};

/**
 * Main exported function for displaying errors
 * Supports multiple display styles and callbacks
 */
export const showError = ({
  errorType,
  message,
  displayStyle: style = displayStyle.toast,
  onRetry,
  onDismiss,
  notificationOption,
}: ShowErrorProps) => {
  const displayMessage = message ?? DEFAULT_ERROR_MESSAGES[errorType];

  switch (style) {
    case displayStyle.toast:
    default:
      showErrorToast(displayMessage, errorType, onRetry, onDismiss, notificationOption);
      break;
    // Future implementations: banner, modal
  }
};

/**
 * Hook for using error display in components
 */
export const useErrorDisplay = () => {
  return useMemo(
    () => ({
      show: showError,
      dismiss: toast.dismiss,
    }),
    [],
  );
};

/**
 * Context provider component (placeholder for future context implementation)
 */
export const ErrorDisplayProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};
