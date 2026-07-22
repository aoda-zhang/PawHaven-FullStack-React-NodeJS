import { ChevronRight } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const STATS = [
  { value: '8,412', labelKey: 'home.hero_stat_rescues' },
  { value: '3,207', labelKey: 'home.hero_stat_adopted' },
  { value: '1,940', labelKey: 'home.hero_stat_volunteers' },
] as const;

export const Hero = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <section
      aria-label={t('home.hero_aria_label')}
      className="bg-hero-bg -mx-4 flex min-h-96 flex-col items-center gap-10 px-4 sm:-mx-8 sm:px-8 lg:-mx-28 lg:min-h-[30rem] lg:flex-row lg:gap-10 lg:px-28"
    >
      <div className="flex w-full flex-col lg:w-7/12">
        <h1 className="text-dark-text text-hero">
          <Trans
            i18nKey="home.hero_headline"
            key={i18n.language}
            components={{
              highlight: <em className="text-primary not-italic" />,
            }}
          />
        </h1>

        <p className="text-body-text text-body mt-4 max-w-95">
          {t('home.hero_subtitle')}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="text-text-inverse bg-dark-text text-body cursor-pointer rounded-xl px-4 py-2 font-semibold transition-colors hover:opacity-90"
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

        <div className="divide-dark-text/15 text-dark-text mt-10 flex flex-row divide-x">
          {STATS.map((stat) => (
            <div
              key={stat.labelKey}
              className="flex flex-col px-2 py-0 first:pl-0 last:pr-0 sm:px-6 sm:first:pl-0 sm:last:pr-0"
            >
              <span className="sm:text-stat text-xl">{stat.value}</span>
              <span className="text-stat-labels mt-1 text-xs">
                {t(stat.labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative hidden w-full lg:block lg:w-5/12">
        <img
          src="/images/hero-rescue.jpg"
          alt={t('home.hero_image_alt')}
          className="h-96 w-full rounded-2xl object-cover lg:h-[30rem]"
          fetchPriority="high"
        />
      </div>
    </section>
  );
};
