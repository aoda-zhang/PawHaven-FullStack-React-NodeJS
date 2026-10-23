import { FileDownloadButton, showToast } from '@pawhaven/ui';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RescueGuideDownloadItem } from '../types';

interface GuideDownloadCardProps {
  item: RescueGuideDownloadItem;
  downloadPdf: (slug: string) => Promise<Blob>;
}

export const GuideDownloadCard = ({
  item,
  downloadPdf,
}: GuideDownloadCardProps) => {
  const { t } = useTranslation();

  const GuideIcon = item.icon;

  return (
    <article className="bg-card border-border shadow-card hover:shadow-modal flex flex-col gap-4 rounded-card border p-5 transition-shadow">
      <div className="flex items-start gap-3">
        <span className="bg-accent text-accent-foreground flex size-11 shrink-0 items-center justify-center rounded-icon">
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
        onError={() => {
          showToast({
            type: 'error',
            message: t('rescueGuide.download_failed'),
          });
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Download className="size-4" aria-hidden="true" />
          <span>{t('rescueGuide.download')}</span>
        </span>
      </FileDownloadButton>
    </article>
  );
};
