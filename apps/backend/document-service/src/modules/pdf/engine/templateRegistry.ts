import { createElement, type ComponentType, type ReactElement } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';
import type { GuideSlug } from '@pawhaven/shared/types';

export interface PdfTemplateDescriptor {
  element: (instance: i18n) => ReactElement;
}

interface PdfTemplateConfig {
  Component: ComponentType;
}

export const definePdfTemplate = ({
  Component,
}: PdfTemplateConfig): PdfTemplateDescriptor => ({
  element: (instance) =>
    createElement(
      I18nextProvider,
      { i18n: instance },
      createElement(Component),
    ),
});

export const renderPdfElement = (element: ReactElement): string =>
  ReactDOMServer.renderToStaticMarkup(element);

const registry = new Map<GuideSlug, PdfTemplateDescriptor>();

export const registerTemplates = (
  templates: Record<GuideSlug, PdfTemplateDescriptor>,
): void => {
  Object.entries(templates).forEach(([name, descriptor]) => {
    registry.set(name as GuideSlug, descriptor);
  });
};

export const getPdfTemplate = (template: GuideSlug): PdfTemplateDescriptor => {
  const descriptor = registry.get(template);
  if (!descriptor) {
    throw new Error(`Unknown PDF template: ${template}`);
  }
  return descriptor;
};
