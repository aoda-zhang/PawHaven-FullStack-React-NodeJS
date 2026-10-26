import { cn } from '@pawhaven/ui';
import { Clock, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AdoptablePet } from '../types';

interface PetCardProps {
  pet: AdoptablePet;
  onClick?: (id: string) => void;
}

export const PetCard = ({ pet, onClick }: PetCardProps) => {
  const { t } = useTranslation();
  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={isInteractive ? () => onClick?.(pet.id) : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(pet.id);
              }
            }
          : undefined
      }
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      aria-label={isInteractive ? pet.name : undefined}
      className={cn(
        'bg-background border-border rounded-card-large w-64 flex-shrink-0 snap-start overflow-hidden border shadow-sm transition-all',
        isInteractive && 'cursor-pointer hover:-translate-y-1 hover:shadow-md',
      )}
    >
      <div className="bg-muted relative h-44">
        <img
          src={pet.photo}
          alt={isInteractive ? '' : pet.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
            {t('home.adoptable_badge')}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="bg-card/80 text-text-secondary absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm"
        >
          <Heart className="h-4 w-4" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-foreground mb-1 font-serif text-base font-semibold">
          {pet.name}
        </h3>
        <p className="text-text-secondary mb-2 text-xs">
          {pet.age} · {pet.sex}
        </p>
        <div className="mb-3 flex flex-wrap gap-1">
          {pet.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="text-text-secondary flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {t('home.waiting_days', { days: pet.waitingDays })}
        </div>
      </div>
    </div>
  );
};
