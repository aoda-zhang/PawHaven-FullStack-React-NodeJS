import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export const CommonFooter = (): ReactElement => {
  const { t } = useTranslation(undefined, { keyPrefix: 'document.pdf.footer' });

  return (
    <div className="border-brown-3 text-gray-6 text-body flex w-full items-center justify-between border-t px-10 pt-1.5 pb-3.5">
      <div className="tracking-[0.5px]">
        {t('copyright', {
          year: new Date().getFullYear(),
        })}
      </div>
      <div className="text-gray-8 font-semibold">
        <span className="pageNumber" />
        {' / '}
        <span className="totalPages" />
      </div>
    </div>
  );
};
