import type { GuideSlug } from '@pawhaven/shared/types';
import type { LucideIcon } from 'lucide-react';

export interface RescueGuideDownloadItem {
  slug: GuideSlug;
  fileName: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

export interface RescueGuideStep {
  icon: LucideIcon;
  title: string;
  description: string;
}
