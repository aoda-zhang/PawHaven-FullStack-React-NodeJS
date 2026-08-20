import { AlertTriangle, CheckCircle, MapPin, PawPrint } from 'lucide-react';

export const STEPS = [
  { icon: MapPin },
  { icon: PawPrint },
  { icon: AlertTriangle },
  { icon: AlertTriangle },
  { icon: CheckCircle },
] as const;

export const TOTAL_STEPS = STEPS.length;
export const FALLBACK_ID_SUFFIX_LENGTH = 8;

export const Step = {
  LOCATION: 1,
  ANIMAL: 2,
  CONDITION: 3,
  URGENCY: 4,
  CONFIRM: 5,
} as const;
