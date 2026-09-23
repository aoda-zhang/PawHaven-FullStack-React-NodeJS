import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import logoSrc from '../../../assets/logo.png';

export const CommonHeader = (): ReactElement => {
  const { t } = useTranslation(undefined, { keyPrefix: 'document.pdf.header' });

  return (
    <div className="text-gray-6 text-body flex w-full items-center justify-between px-10 pb-10">
      <img src={logoSrc} alt="PawHaven" className="h-7 w-auto self-start" />
      <div className="tracking-[0.5px]">{t('tagline')}</div>
    </div>
  );
};
