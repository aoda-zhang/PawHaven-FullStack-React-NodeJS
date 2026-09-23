import { createElement, type ComponentType, type ReactElement } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';
import type { GuideSlug } from '@pawhaven/shared/types';

import { RescueGuide } from './rescue-guide/RescueGuide.js';
import { FirstAid } from './first-aid/FirstAid.js';
import { KittenCare } from './kitten-care/KittenCare.js';
import { InjuryResponse } from './injury-response/InjuryResponse.js';

export interface PdfTemplateDescriptor {
  element: (instance: i18n) => ReactElement;
}

interface PdfTemplateConfig {
  Component: ComponentType;
}

const definePdfTemplate = ({
  Component,
}: PdfTemplateConfig): PdfTemplateDescriptor => ({
  element: (instance) =>
    createElement(
      I18nextProvider,
      { i18n: instance },
      createElement(Component),
    ),
});

export const pdfTemplates = {
  rescueGuide: definePdfTemplate({ Component: RescueGuide }),
  firstAid: definePdfTemplate({ Component: FirstAid }),
  kittenCare: definePdfTemplate({ Component: KittenCare }),
  injuryResponse: definePdfTemplate({ Component: InjuryResponse }),
} satisfies Record<GuideSlug, PdfTemplateDescriptor>;

export type PdfTemplateName = keyof typeof pdfTemplates;

export const getPdfTemplate = (
  template: PdfTemplateName,
): PdfTemplateDescriptor => pdfTemplates[template];

export const renderPdfElement = (element: ReactElement): string =>
  ReactDOMServer.renderToStaticMarkup(element);
