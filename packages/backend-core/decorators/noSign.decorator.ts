import type { CustomDecorator } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

import { commonDecoratorsKeys } from './decorator.constant';

export const NoSign = (): CustomDecorator =>
  SetMetadata(commonDecoratorsKeys.noSign, true);
