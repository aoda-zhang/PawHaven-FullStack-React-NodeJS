import { FileDownloadButton } from '@pawhaven/frontend-core';
import { showToast } from '@pawhaven/ui';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { downloadPdf } from '../api/pdf.api';
import type { RescueGuideDownloadItem } from '../types';

interface GuideDownloadCardProps {
  item: RescueGuideDownloadItem;
}

export const GuideDownloadCard = ({ item }: GuideDownloadCardProps) => {
  const { t } = useTranslation();

  const GuideIcon = item.icon;

  return (
    <article className="bg-card border-border shadow-card hover:shadow-modal flex flex-col gap-4 rounded-2xl border p-5 transition-shadow">
      <div className="flex items-start gap-3">
        <span className="bg-accent text-accent-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
          <GuideIcon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-text text-lg font-semibold">
            {t(item.titleKey)}
          </h3>
          <p className="text-text-secondary mt-1 text-sm leading-relaxed">
            {t(item.descriptionKey)}
          </p>
        </div>
      </div>

      <FileDownloadButton
        fileFetchRequest={() => downloadPdf(item.slug)}
        fileName={item.fileName}
        fileType="PDF"
        onError={() => {
          showToast({
            type: 'error',
            message: t('rescueGuide.download_failed'),
          });
        }}
        buttonClassName="w-full cursor-pointer"
        contentClassName="flex items-center justify-center gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        <span>{t('rescueGuide.download')}</span>
      </FileDownloadButton>
    </article>
  );
};
