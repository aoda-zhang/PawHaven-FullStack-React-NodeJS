import { notificationType, showToast, type ShowToastInput } from '@pawhaven/ui';
import type { ReactNode } from 'react';

import { httpRequestErrors } from '../../api/types';
import type { HttpRequestErrorType } from '../../api/types';

const DEFAULT_ERROR_MESSAGES: Record<HttpRequestErrorType, string> = {
  NETWORK:
    'Network connection error. Please check your internet connection and try again.',
  SERVER: 'Server error occurred. Please try again later.',
  AUTH: 'Your session has expired. Please log in again.',
  PERMISSION: 'You do not have permission to perform this action.',
  RATELIMIT: 'Too many requests. Please wait a moment and try again.',
  BADREQUEST: 'Invalid request. Please check your input and try again.',
  MAINTENANCE:
    'The service is temporarily under maintenance. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

export interface ErrorDisplayProps {
  errorType: HttpRequestErrorType;
  message?: string | ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  notificationOption?: Omit<ShowToastInput, 'message'>;
}

const getErrorTypeLabel = (type: HttpRequestErrorType): string => {
  switch (type) {
    case httpRequestErrors.NETWORK:
      return 'Network Error';
    case httpRequestErrors.SERVER:
      return 'Server Error';
    case httpRequestErrors.AUTH:
      return 'Auth Error';
    case httpRequestErrors.PERMISSION:
      return 'Permission Denied';
    case httpRequestErrors.BADREQUEST:
      return 'Invalid Request';
    case httpRequestErrors.RATELIMIT:
      return 'Too Many Requests';
    case httpRequestErrors.MAINTENANCE:
      return 'Maintenance Mode';
    default:
      return 'Error';
  }
};

const ErrorMessage = ({
  message,
  errorType,
  onRetry,
  onDismiss,
}: {
  message: string | ReactNode;
  errorType: HttpRequestErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold tracking-wide uppercase opacity-80">
        {getErrorTypeLabel(errorType)}
      </div>
      <div className="text-sm font-medium">{message}</div>
      {(onRetry || onDismiss) && (
        <div className="flex gap-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium underline transition-all hover:no-underline"
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
              className="text-sm font-medium underline transition-all hover:no-underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const showError = ({
  errorType,
  message,
  onRetry,
  onDismiss,
  notificationOption,
}: ErrorDisplayProps) => {
  const displayMessage = message ?? DEFAULT_ERROR_MESSAGES[errorType];
  const globalErrorID = `PAWHAVEN_ERROR_${errorType}`;

  const content: ReactNode = (
    <div onClick={() => onDismiss?.()} className="cursor-pointer">
      <ErrorMessage
        message={displayMessage}
        errorType={errorType}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    </div>
  );

  showToast({
    id: globalErrorID,
    type: notificationType.error,
    message: content,
    duration: notificationOption?.duration ?? Number.POSITIVE_INFINITY,
  });
};

export const useErrorDisplay = () => {
  return {
    show: showError,
  };
};

export const ErrorDisplayProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export { httpRequestErrors };
export type { HttpRequestErrorType };
