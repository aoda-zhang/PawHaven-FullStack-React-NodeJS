import type { GuideSlug } from '@pawhaven/shared/types';

import {
  definePdfTemplate,
  registerTemplates,
  type PdfTemplateDescriptor,
} from '../engine/templateRegistry.js';

import { RescueGuide } from './rescue-guide/RescueGuide.js';
import { FirstAid } from './first-aid/FirstAid.js';
import { KittenCare } from './kitten-care/KittenCare.js';
import { InjuryResponse } from './injury-response/InjuryResponse.js';

export const pdfTemplates = {
  rescueGuide: definePdfTemplate({ Component: RescueGuide }),
  firstAid: definePdfTemplate({ Component: FirstAid }),
  kittenCare: definePdfTemplate({ Component: KittenCare }),
  injuryResponse: definePdfTemplate({ Component: InjuryResponse }),
} satisfies Record<GuideSlug, PdfTemplateDescriptor>;

registerTemplates(pdfTemplates);
