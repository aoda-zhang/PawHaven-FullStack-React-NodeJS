import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col lg:flex-row justify-center lg:justify-between items-center lg:items-center p-1 mb-5 pl-5 lg:pl-10 box-border overflow-hidden h-screen">
      <img
        src="/images/hero.webp"
        alt="hero"
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-base text-left text-white px-4">
        <p className="text-4xl lg:text-7xl font-bold text-white mb-2 lg:mb-6">
          {t('common.slogan')}
        </p>
        <p className="text-xl lg:text-3xl text-gray-200 mb-6 lg:mb-10">
          {t('common.subSlogan')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-start">
          <button
            type="button"
            className="roundedButton text-xl bg-primary text-white hover:bg-primary-dark transition-colors"
            onClick={() => {
              navigate('/report-stray');
            }}
          >
            {t('home.report')}
          </button>
          <button
            type="button"
            className="roundedButton text-xl bg-white text-primary hover:bg-gray-100 transition-colors"
          >
            {t('home.rescue')}
          </button>
        </div>
      </div>
    </div>
  );
};
