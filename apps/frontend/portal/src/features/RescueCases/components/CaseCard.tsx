import { formatDateTime } from '@pawhaven/frontend-core';
import { PhotoPlaceholder } from '@pawhaven/ui';
import { Clock, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RescueCase } from '../types';

import { StatusBadge } from './StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';

interface CaseCardProps {
  caseData: RescueCase;
  onClick: (id: string) => void;
}

export const CaseCard = ({ caseData, onClick }: CaseCardProps) => {
  const { i18n } = useTranslation();
  return (
    <div
      onClick={() => onClick(caseData.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(caseData.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={caseData.title}
      className="border-border bg-card group cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="bg-muted relative h-48 overflow-hidden">
        {caseData.image ? (
          <img
            src={caseData.image}
            alt={caseData.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PhotoPlaceholder iconClassName="h-12 w-12" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge status={caseData.status} />
          {caseData.urgency === 'high' && (
            <UrgencyBadge urgency={caseData.urgency} />
          )}
        </div>
        <div className="absolute right-3 bottom-3 left-3">
          <h3 className="font-serif text-lg leading-tight font-semibold text-white drop-shadow">
            {caseData.title}
          </h3>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start gap-2">
          <MapPin className="text-text-secondary mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-text-secondary text-xs">
            {caseData.location}
          </span>
        </div>
        <p className="text-foreground/80 mb-3 line-clamp-2 text-sm">
          {caseData.description}
        </p>
        <div className="border-border flex items-center justify-between border-t pt-3">
          <div className="text-text-secondary flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            {formatDateTime(caseData.reportedAt, i18n.language)}
          </div>
          {caseData.distance > 0 && (
            <div className="text-primary bg-accent flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
              <MapPin className="h-3 w-3" />
              {caseData.distance} km
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
