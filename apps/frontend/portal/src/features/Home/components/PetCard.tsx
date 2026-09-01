import { Clock, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AdoptablePet } from '../types';

interface PetCardProps {
  pet: AdoptablePet;
  onClick: (id: string) => void;
}

export const PetCard = ({ pet, onClick }: PetCardProps) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={() => onClick(pet.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(pet.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={pet.name}
      className="bg-background border-border w-64 flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="bg-muted relative h-44">
        <img
          src={pet.photo}
          alt={pet.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            {t('home.adoptable_badge')}
          </span>
        </div>
        <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-400 backdrop-blur-sm transition-colors hover:text-red-500">
          <Heart className="h-4 w-4" />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-foreground font-serif text-base font-semibold">
            {pet.name}
          </h3>
          <span className="text-lg" aria-hidden="true">
            {pet.animalType === 'cat' ? '🐱' : '🐕'}
          </span>
        </div>
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
