import { BadRequestException } from '@nestjs/common';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { GuideLocaleSchema, type GuideLocale } from '@pawhaven/shared/types';

type RequestHeaders = Record<string, string | string[] | undefined>;

export const resolveRequestLocale = (headers: RequestHeaders): GuideLocale => {
  const raw = headers[httpHeaders.appLocale];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const result = GuideLocaleSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(
      `Invalid or missing ${httpHeaders.appLocale} header`,
    );
  }

  return result.data;
};
