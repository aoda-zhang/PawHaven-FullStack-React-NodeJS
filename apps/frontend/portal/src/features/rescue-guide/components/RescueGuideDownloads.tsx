import {
  rescueGuideCatalog,
  rescueGuidePresentations,
  rescueGuideDefaultIcon,
} from '../constants';
import type { RescueGuideDownloadItem } from '../types';

import { GuideDownloadCard } from './GuideDownloadCard';

export const RescueGuideDownloads = () => {
  const items: RescueGuideDownloadItem[] = rescueGuideCatalog.map((doc) => {
    const presentation = rescueGuidePresentations[doc.slug];
    return {
      slug: doc.slug,
      fileName: doc.fileName,
      icon: presentation?.icon ?? rescueGuideDefaultIcon,
      titleKey: `rescueGuide.documents.${doc.slug}.title`,
      descriptionKey: `rescueGuide.documents.${doc.slug}.description`,
    };
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item) => (
        <GuideDownloadCard key={item.slug} item={item} />
      ))}
    </div>
  );
};
