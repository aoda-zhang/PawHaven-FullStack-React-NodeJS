import type { ReactElement } from 'react';
import React from 'react';
import type { ToastOptions } from 'react-hot-toast';
import toast from 'react-hot-toast';

import { httpRequestErrors } from '../../api/types';
import type { HttpRequestErrorType } from '../../api/types';

/**
 * Default error messages for each error type.
 * These can be overridden with i18n translations at runtime.
 */
const DEFAULT_ERROR_MESSAGES: Record<HttpRequestErrorType, string> = {
  NETWORK: 'Network connection error. Please check your internet connection and try again.',
  SERVER: 'Server error occurred. Please try again later.',
  AUTH: 'Your session has expired. Please log in again.',
  PERMISSION: 'You do not have permission to perform this action.',
  RATELIMIT: 'Too many requests. Please wait a moment and try again.',
  BADREQUEST: 'Invalid request. Please check your input and try again.',
  MAINTENANCE: 'The service is temporarily under maintenance. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

export interface ErrorDisplayProps {
  errorType: HttpRequestErrorType;
  message?: string | ReactElement;
  onRetry?: () => void;
  onDismiss?: () => void;
  notificationOption?: ToastOptions;
}

/**
 * Renders error message with appropriate styling and actions
 * Uses Tailwind CSS classes for styling
 */
const ErrorMessage: React.FC<{
  message: string | ReactElement;
  errorType: HttpRequestErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ message, errorType, onRetry, onDismiss }) => {
  const getErrorTypeLabel = (type: HttpRequestErrorType): string => {
    switch (type) {
      case httpRequestErrors.NETWORK:
        return '🌐 Network Error';
      case httpRequestErrors.SERVER:
        return '⚠️ Server Error';
      case httpRequestErrors.AUTH:
        return '🔐 Auth Error';
      case httpRequestErrors.PERMISSION:
        return '🚫 Permission Denied';
      case httpRequestErrors.BADREQUEST:
        return '❌ Invalid Request';
      case httpRequestErrors.RATELIMIT:
        return '⏱️ Too Many Requests';
      case httpRequestErrors.MAINTENANCE:
        return '🔧 Maintenance Mode';
      default:
        return '⚠️ Error';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {getErrorTypeLabel(errorType)}
      </div>
      <div className="text-sm font-medium">{message}</div>
      {(onRetry || onDismiss) && (
        <div className="flex gap-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium underline hover:no-underline transition-all"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="text-sm font-medium underline hover:no-underline transition-all"
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
 * Display error with toast notification
 */
const showErrorToast = (
  message: string | ReactElement,
  errorType: HttpRequestErrorType,
  onRetry?: () => void,
  onDismiss?: () => void,
  notificationOption?: ToastOptions,
) => {
  const globalErrorID = `PAWHAVEN_ERROR_${errorType}`;

  // Merge options carefully: only override defaults if explicitly provided
  const toastOptions: ToastOptions = {
    id: globalErrorID,
    duration: notificationOption?.duration ?? Infinity,
    position: notificationOption?.position ?? 'top-center',
    className: notificationOption?.className ?? 'bg-red-600 text-white rounded-lg shadow-lg max-w-2xl',
    ...(() => {
      if (!notificationOption) return {};
      const { duration, position, className, ...rest } = notificationOption;
      return rest;
    })(),
  };

  toast.error(
    (t) => (
      <div
        onClick={() => {
          if (onDismiss) {
            onDismiss();
          }
          toast.dismiss(t.id);
        }}
        className="cursor-pointer"
      >
        <ErrorMessage
          message={message}
          errorType={errorType}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      </div>
    ),
    toastOptions,
  );
};

/**
 * Main exported function for displaying errors
 * Supports customization via message, callbacks, and toast options
 */
export const showError = ({
  errorType,
  message,
  onRetry,
  onDismiss,
  notificationOption,
}: ErrorDisplayProps) => {
  const displayMessage = message ?? DEFAULT_ERROR_MESSAGES[errorType];
  showErrorToast(displayMessage, errorType, onRetry, onDismiss, notificationOption);
};

/**
 * Hook for using error display in components
 * Provides convenient access to error display functionality
 */
export const useErrorDisplay = () => {
  return {
    show: showError,
    dismiss: toast.dismiss,
  };
};

/**
 * Context provider component for future enhancements
 */
export const ErrorDisplayProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

// Re-export error types for convenient access
export { httpRequestErrors };
export type { HttpRequestErrorType };
