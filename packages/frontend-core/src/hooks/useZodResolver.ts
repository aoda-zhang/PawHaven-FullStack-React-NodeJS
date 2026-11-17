import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import type { FieldValues, Resolver, ResolverResult } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { ZodType } from 'zod';

import { translateFieldErrors } from '../utils/translateFieldErrors';

export const useZodResolver = <TInput extends FieldValues, TOutput>(
  schema: ZodType<TOutput, TInput>,
): Resolver<TInput, unknown, TOutput> => {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    const resolver = zodResolver(schema);
    const translate = (message: string) =>
      i18n.exists(message, { returnObjects: false }) ? t(message) : message;

    return async (values, context, options) => {
      const result = await resolver(values, context, options);
      return {
        ...result,
        errors: translateFieldErrors(result.errors, translate),
      } as ResolverResult<TInput, TOutput>;
    };
  }, [schema, t, i18n]);
};
