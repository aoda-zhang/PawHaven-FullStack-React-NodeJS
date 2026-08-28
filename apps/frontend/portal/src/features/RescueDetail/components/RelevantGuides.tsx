import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Guide {
  icon: string;
  title: string;
  readTime: string;
}

const GUIDES: Guide[] = [
  {
    icon: '🚨',
    title: 'guide_injured',
    readTime: 'guide_injured_read',
  },
  {
    icon: '🐱',
    title: 'guide_kitten',
    readTime: 'guide_kitten_read',
  },
  {
    icon: '🚗',
    title: 'guide_vehicle',
    readTime: 'guide_vehicle_read',
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
            className="border-border bg-background-soft hover:border-primary flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors"
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
