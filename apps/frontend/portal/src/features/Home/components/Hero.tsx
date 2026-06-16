import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="pl-gutter relative mb-5 box-border flex h-screen flex-col items-center justify-center overflow-hidden p-4 lg:flex-row lg:items-center lg:justify-between lg:pl-10">
      <img
        src="/images/hero.webp"
        alt="hero"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="z-base relative px-4 text-left text-white">
        <p className="mb-2 text-4xl font-bold text-white lg:mb-6 lg:text-7xl">
          {t('common.slogan')}
        </p>
        <p className="text-text-inverse mb-6 text-xl lg:mb-10 lg:text-3xl">
          {t('common.subSlogan')}
        </p>
        <div className="flex flex-col justify-start gap-4 sm:flex-row">
          <button
            type="button"
            className="button-rounded bg-primary text-text-inverse hover:bg-primary-hover text-xl transition-colors"
            onClick={() => {
              navigate('/report-stray');
            }}
          >
            {t('home.report')}
          </button>
          <button
            type="button"
            className="button-rounded bg-surface text-primary hover:bg-surface-hover text-xl transition-colors"
          >
            {t('home.rescue')}
          </button>
        </div>
      </div>
    </div>
  );
};
