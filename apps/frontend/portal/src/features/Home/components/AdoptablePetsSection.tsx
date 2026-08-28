import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdoptablePet } from '../types';

import { AdoptablePetsSectionSkeleton } from './AdoptablePetsSectionSkeleton';
import { PetCard } from './PetCard';

interface AdoptablePetsSectionProps {
  pets: AdoptablePet[];
  onPetClick: (id: string) => void;
  onSeeAll?: () => void;
  isLoading?: boolean;
}

export const AdoptablePetsSection = ({
  pets,
  onPetClick,
  onSeeAll,
  isLoading = false,
}: AdoptablePetsSectionProps) => {
  const { t } = useTranslation();

  let content: ReactNode;
  if (isLoading) {
    content = <AdoptablePetsSectionSkeleton />;
  } else if (pets.length === 0) {
    content = (
      <p className="text-muted-foreground py-16 text-center">
        {t('home.forever_home_no_pets')}
      </p>
    );
  } else {
    content = (
      <div
        className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} onClick={onPetClick} />
        ))}
      </div>
    );
  }

  return (
    <section
      className="border-border bg-muted/50 border-t border-b py-10"
      aria-label={t('home.forever_home_aria_label')}
      aria-busy={isLoading}
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

        {content}
      </div>
    </section>
  );
};
