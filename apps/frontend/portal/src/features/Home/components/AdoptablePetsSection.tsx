import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AdoptablePet } from '../types';

import { PetCard } from './PetCard';

interface AdoptablePetsSectionProps {
  pets: AdoptablePet[];
  onPetClick: (id: string) => void;
  onSeeAll?: () => void;
}

export const AdoptablePetsSection = ({
  pets,
  onPetClick,
  onSeeAll,
}: AdoptablePetsSectionProps) => {
  const { t } = useTranslation();

  return (
    <section
      className="border-border bg-muted/50 border-t border-b py-10"
      aria-label={t('home.forever_home_aria_label')}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-foreground font-serif text-2xl font-bold">
              {t('home.forever_home_title')}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('home.forever_home_subtitle')}
            </p>
          </div>
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-primary hidden items-center gap-1.5 text-sm font-medium hover:underline sm:flex"
            >
              {t('home.forever_home_see_all')}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {pets.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">
            {t('home.forever_home_no_pets')}
          </p>
        ) : (
          <div
            className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} onClick={onPetClick} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
