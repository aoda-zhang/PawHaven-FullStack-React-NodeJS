import { cn } from '@pawhaven/frontend-core';
import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Guide {
  icon: string;
  title: string;
  readTime: string;
  highlight: string;
}

const GUIDES: Guide[] = [
  {
    icon: '🚨',
    title: 'guide_injured',
    readTime: 'guide_injured_read',
    highlight: 'bg-pink-50',
  },
  {
    icon: '🐱',
    title: 'guide_kitten',
    readTime: 'guide_kitten_read',
    highlight: 'bg-background-soft',
  },
  {
    icon: '🚗',
    title: 'guide_vehicle',
    readTime: 'guide_vehicle_read',
    highlight: 'bg-amber-50',
  },
];

export const RelevantGuides = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-card border-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <h2 className="text-text-secondary mb-4 flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
        <BookOpen className="h-4 w-4" aria-hidden="true" />
        {t('rescueDetail.relevant_guides')}
      </h2>

      <div className="space-y-3">
        {GUIDES.map((guide) => (
          <button
            key={guide.title}
            type="button"
            className={cn(
              'border-border hover:border-primary flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
              guide.highlight,
            )}
          >
            <span className="text-lg" aria-hidden="true">
              {guide.icon}
            </span>
            <div>
              <p className="text-foreground text-sm font-medium">
                {t(`rescueDetail.${guide.title}`)}
              </p>
              <p className="text-text-secondary text-xs">
                {t(`rescueDetail.${guide.readTime}`)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
