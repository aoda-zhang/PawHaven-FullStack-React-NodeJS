import type { NextFunction, Request, Response } from 'express';
import { normalizeLocale } from '@pawhaven/shared/types';

import { httpHeaders } from '../constants/httpHeaders.js';
import { readHeader } from '../utils/readHeader.js';

const firstLocale = (value?: string): string =>
  (value ?? '').split(',')[0]?.trim() ?? '';

export const localeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const { headers } = req;
  headers[httpHeaders.appLocale] = normalizeLocale(
    firstLocale(readHeader(headers, httpHeaders.appLocale)) ||
      firstLocale(readHeader(headers, httpHeaders.acceptLanguage)),
  );
  next();
};
