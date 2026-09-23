import type { GuideSlug } from '@pawhaven/shared/types';
import {
  Baby,
  BookOpen,
  Camera,
  Droplets,
  HeartPulse,
  PhoneCall,
  Search,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

interface RescueGuidePresentation {
  icon: LucideIcon;
}

export const rescueGuideDefaultIcon = BookOpen;

export const rescueGuidePresentations: Record<string, RescueGuidePresentation> =
  {
    rescueGuide: {
      icon: BookOpen,
    },
    firstAid: {
      icon: HeartPulse,
    },
    kittenCare: {
      icon: Baby,
    },
    injuryResponse: {
      icon: ShieldAlert,
    },
  };

export interface RescueGuideCatalogEntry {
  slug: GuideSlug;
  fileName: string;
}

export const rescueGuideCatalog: RescueGuideCatalogEntry[] = [
  { slug: 'rescueGuide', fileName: 'PawHaven-Rescue-Basics' },
  { slug: 'firstAid', fileName: 'PawHaven-First-Aid-Reference' },
  { slug: 'kittenCare', fileName: 'PawHaven-Orphaned-Baby-Care' },
  { slug: 'injuryResponse', fileName: 'PawHaven-Injury-Field-Response' },
];

export const rescueStepIcons: LucideIcon[] = [
  Search,
  ShieldCheck,
  Droplets,
  PhoneCall,
  Camera,
];
