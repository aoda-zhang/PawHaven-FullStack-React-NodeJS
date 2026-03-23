import { type ToastType, notificationType, showToast } from '@pawhaven/ui';
import { QueryCache, MutationCache } from '@tanstack/react-query';
import i18n, { t } from 'i18next';
import '@pawhaven/i18n';
import type { ToastOptions } from 'react-hot-toast';

import { type ApiErrorInfo, httpRequestErrors } from '../api/types';

interface RequestMeta {
  isNetworkError?: boolean;
  isShowClientError?: boolean;
  isCriticalRequest?: boolean;
  toastOptions?: { type: ToastType } & ToastOptions;
}

interface QueryOptionsType {
  refetchOnReconnect?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  gcTime?: number;
  maxRetry?: number;
  onAuthError?: () => void;
  onPermissionError?: () => void;
  onSysError?: () => void;
}

interface ErrorHandleType {
  queryOptions: QueryOptionsType;
  errorInfo: ApiErrorInfo;
  meta: RequestMeta;
}

const showErrorToast = (
  errorMessage: string,
  errorNotificationOptions?: { type: ToastType } & ToastOptions,
) => {
  showToast({
    message: errorMessage,
    ...(errorNotificationOptions ?? {}),
  });
};

const handleError = ({ queryOptions, errorInfo, meta }: ErrorHandleType) => {
  let errorMessage = t('errorMessage.UNKNOWN_ERROR');
  if (i18n.exists(`errorMessage.${errorInfo?.code}`)) {
    errorMessage = t(`errorMessage.${errorInfo?.code}`);
  }
  const metaData: RequestMeta = {
    isShowClientError: false,
    isNetworkError: true,
    ...meta,
  };
  switch (errorInfo.type) {
    // Auth---------
    case httpRequestErrors.AUTH:
      queryOptions?.onAuthError?.();
      break;
    case httpRequestErrors.PERMISSION:
      queryOptions?.onPermissionError?.();
      break;

    // Server
    case httpRequestErrors.SERVER:
    case httpRequestErrors.UNKNOWN:
      if (meta?.isCriticalRequest && queryOptions?.onSysError) {
        queryOptions?.onSysError?.();
        return;
      }
      showErrorToast(errorMessage, {
        ...(metaData?.toastOptions ?? {}),
        type: metaData?.toastOptions?.type ?? notificationType.info,
        duration: metaData?.toastOptions?.duration ?? 500,
      });
      break;

    // client------------
    case httpRequestErrors.BADREQUEST:
    case httpRequestErrors.RATELIMIT:
      break;
    // Network ----------
    case httpRequestErrors.NETWORK:
      if (metaData?.isNetworkError) {
        showErrorToast(errorMessage, {
          ...(metaData?.toastOptions ?? {}),
          type: metaData?.toastOptions?.type ?? notificationType.info,
          duration: metaData?.toastOptions?.duration ?? 100,
        });
      }
      break;
    default:
      break;
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRequestQueryOptions = (queryOptions: QueryOptionsType) => {
  const {
    refetchOnReconnect = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // Data is considered fresh within 5 minutes
    gcTime = 30 * 60 * 1000, // Query cache garbage collection after 30 minutes
    maxRetry = 2, // Default max retry 2 times
  } = queryOptions ?? {};

  return {
    defaultOptions: {
      queries: {
        refetchOnReconnect,
        refetchOnWindowFocus,
        staleTime,
        gcTime,
        retry: (failureCount: number, error: unknown) => {
          const apiError = error as ApiErrorInfo;
          if (!apiError) return false;
          const retryAbleErrors = [
            httpRequestErrors.NETWORK,
            httpRequestErrors.UNKNOWN,
            httpRequestErrors.SERVER,
          ] as const;
          return (
            failureCount < maxRetry &&
            retryAbleErrors.includes(
              apiError?.type as (typeof retryAbleErrors)[number],
            )
          );
        },
      },
    },

    queryCache: new QueryCache({
      onError: (errorInfo, query) => {
        // Do not show errors for queries that already have data
        if (query.state.data !== undefined) return;
        handleError({
          queryOptions,
          errorInfo: errorInfo as unknown as ApiErrorInfo,
          meta: query?.meta ?? {},
        });
      },
    }),

    mutationCache: new MutationCache({
      onError: (errorInfo, _variables, _context, mutation) => {
        const meta = mutation.meta as RequestMeta;
        handleError({
          queryOptions,
          errorInfo: errorInfo as unknown as ApiErrorInfo,
          meta,
        });
      },
    }),
  };
};
