import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const STATS = [
  { value: '8,412', labelKey: 'home.hero_stat_rescues' },
  { value: '3,207', labelKey: 'home.hero_stat_adopted' },
  { value: '1,940', labelKey: 'home.hero_stat_volunteers' },
] as const;

export const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section
      aria-label={t('home.hero_aria_label')}
      className="bg-hero-bg lg:gap-8-10 -mx-30 flex min-h-130 flex-col items-center gap-10 px-30 lg:flex-row"
    >
      <div className="flex w-full flex-col lg:w-54">
        <h1 className="text-dark-text text-hero">
          {t('home.hero_headline_prefix')}
          <em className="text-primary mx-2 not-italic">
            {t('home.hero_headline_highlight')}
          </em>
          {t('home.hero_headline_suffix')}
        </h1>

        <p className="text-body-text text-body mt-4 max-w-95">
          {t('home.hero_subtitle')}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="text-text-inverse bg-dark-text cursor-pointer rounded-xl px-6 py-3 text-base font-semibold transition-colors hover:opacity-90"
            onClick={() => {
              navigate('/report-stray');
            }}
          >
            <span className="flex items-center gap-1">
              {t('home.hero_report_cta')}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
          <button
            type="button"
            className="text-dark-text cursor-pointer hover:underline"
          >
            {t('home.hero_adopt_cta')}
          </button>
        </div>

        <div className="text-dark-text divide-divider mt-10 flex divide-x">
          {STATS.map((stat) => (
            <div key={stat.labelKey} className="flex flex-col px-6 first:pl-0">
              <span className="text-stat">{stat.value}</span>
              <span className="text-stat-labels mt-1 text-xs">
                {t(stat.labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative hidden w-full lg:block lg:w-46">
        <img
          src="/images/hero-rescue.jpg"
          alt={t('home.hero_image_alt')}
          className="h-130 w-full rounded-2xl object-cover"
          fetchPriority="high"
        />
      </div>
    </section>
  );
};
