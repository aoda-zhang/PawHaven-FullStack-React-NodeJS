import type { BootstrapData } from '@pawhaven/shared/types';
import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import type {
  QueryOptions,
  UseQueryOptions,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';

import { getBootstrapData } from './bootstrap.api';
import { bootstrapQueryKeys, type BootstrapScope } from './bootstrap.queryKeys';

export const bootstrapQueryOptions = (scope?: BootstrapScope) =>
  queryOptions({
    queryKey: bootstrapQueryKeys.data(scope),
    queryFn: getBootstrapData,
    staleTime: Infinity,
    meta: { persist: true },
  }) satisfies QueryOptions<
    BootstrapData,
    Error,
    BootstrapData,
    ReturnType<typeof bootstrapQueryKeys.data>
  >;

type BootstrapQueryOptions = ReturnType<typeof bootstrapQueryOptions>;

export const useBootstrapQuery = (
  scope?: BootstrapScope,
  options?: Omit<
    UseQueryOptions<
      BootstrapData,
      Error,
      BootstrapData,
      BootstrapQueryOptions['queryKey']
    >,
    'queryKey' | 'queryFn'
  >,
) =>
  useQuery<
    BootstrapData,
    Error,
    BootstrapData,
    BootstrapQueryOptions['queryKey']
  >({
    ...bootstrapQueryOptions(scope),
    ...options,
  } as UseQueryOptions<
    BootstrapData,
    Error,
    BootstrapData,
    BootstrapQueryOptions['queryKey']
  >);

export const useSuspenseBootstrapQuery = (
  scope?: BootstrapScope,
  options?: Omit<
    UseSuspenseQueryOptions<
      BootstrapData,
      Error,
      BootstrapData,
      BootstrapQueryOptions['queryKey']
    >,
    'queryKey' | 'queryFn'
  >,
) =>
  useSuspenseQuery<
    BootstrapData,
    Error,
    BootstrapData,
    BootstrapQueryOptions['queryKey']
  >({
    ...bootstrapQueryOptions(scope),
    ...options,
  } as UseSuspenseQueryOptions<
    BootstrapData,
    Error,
    BootstrapData,
    BootstrapQueryOptions['queryKey']
  >);
