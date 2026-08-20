import { FileDownloadButton } from '@pawhaven/frontend-core';
import { showToast } from '@pawhaven/ui';
import { ArrowDownToLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getRescueGuideDocs } from './api/rescueGuide.api';
import { StepCard } from './components/StepCard';

export const RescueGuide = () => {
  const { t } = useTranslation();
  const stepsContent = t('rescueGuide.steps', {
    returnObjects: true,
  }) as Array<{
    icon: string;
    title: string;
    desc: string;
  }>;
  return (
    <div className="bg-[url('/images/hero1.png')] bg-cover bg-center">
      <div className="py-6">
        <h2 className="mb-1 font-bold">{t('rescueGuide.title')}</h2>

        <p className="text-text-secondary mb-4">{t('rescueGuide.intro')}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {stepsContent.map((step) => (
            <StepCard key={step.title} {...step} />
          ))}
        </div>

        <p className="m-6 flex justify-center">
          <FileDownloadButton
            fileFetchRequest={getRescueGuideDocs}
            onError={() => {
              showToast({
                type: 'error',
                message: t('rescueGuide.download_failed'),
              });
            }}
            fileType="PDF"
            contentClassName="flex items-center text-2xl bold cursor-pointer p-4 rounded-2xl"
          >
            <ArrowDownToLine />
            <span>{t('rescueGuide.download_guide')}</span>
          </FileDownloadButton>
        </p>
      </div>
    </div>
  );
};
