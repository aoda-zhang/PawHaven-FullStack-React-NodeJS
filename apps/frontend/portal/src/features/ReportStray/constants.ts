import {
  AlertTriangle,
  Camera,
  CheckCircle,
  MapPin,
  PawPrint,
} from 'lucide-react';

export const STEPS = [
  { icon: Camera },
  { icon: MapPin },
  { icon: PawPrint },
  { icon: AlertTriangle },
  { icon: AlertTriangle },
  { icon: CheckCircle },
] as const;

export const TOTAL_STEPS = STEPS.length;
export const FALLBACK_ID_SUFFIX_LENGTH = 8;

export const Step = {
  PHOTOS: 1,
  LOCATION: 2,
  ANIMAL: 3,
  CONDITION: 4,
  URGENCY: 5,
  CONFIRM: 6,
} as const;
