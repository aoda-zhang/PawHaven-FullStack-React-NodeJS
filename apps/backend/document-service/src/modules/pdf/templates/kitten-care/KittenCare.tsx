import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  PdfChecklist,
  PdfContacts,
  PdfSection,
} from '@pawhaven/shared/types';
import { Cover } from '@PDF/components/Cover.js';
import { SectionList } from '@PDF/components/SectionList.js';
import { Checklist } from '@PDF/components/Checklist.js';
import { Contacts } from '@PDF/components/Contacts.js';
import { Disclaimer } from '@PDF/components/Disclaimer.js';

export const KittenCare = (): ReactElement => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'document.pdf.kittenCare',
  });
  const sections = t('sections', {
    returnObjects: true,
  }) as PdfSection[];
  const checklist = t('checklist', {
    returnObjects: true,
  }) as PdfChecklist;
  const contacts = t('contacts', {
    returnObjects: true,
  }) as PdfContacts;

  return (
    <div className="p-0">
      <Cover title={t('title')} subtitle={t('subtitle')} />

      <div className="px-10">
        <SectionList sections={sections} />
      </div>

      <Checklist checklist={checklist} />

      <Contacts contacts={contacts} />

      <Disclaimer text={t('disclaimer')} />
    </div>
  );
};
