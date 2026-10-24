import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export const CommonFooter = (): ReactElement => {
  const { t } = useTranslation(undefined, { keyPrefix: 'document.pdf.footer' });

  return (
    <div className="border-border text-text-secondary text-body flex w-full items-center justify-between border-t px-10 pt-1.5 pb-3.5">
      <div className="tracking-label">
        {t('copyright', {
          year: new Date().getFullYear(),
        })}
      </div>
      <div className="text-text font-semibold">
        <span className="pageNumber" />
        {' / '}
        <span className="totalPages" />
      </div>
    </div>
  );
};
