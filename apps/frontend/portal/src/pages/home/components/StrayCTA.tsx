import { Camera, PawPrint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useGlobalContext } from '@/app/providers/GlobalProvider';
import { routePaths } from '@/app/router/routePaths';

export const StrayCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useGlobalContext();

  return (
    <section
      className="full-width border-border from-cta-bg to-cta-bg-strong mt-4 border-t bg-gradient-to-br py-14"
      aria-labelledby="home-cta-title"
    >
      <div className="px-4 text-center sm:px-6">
        <PawPrint className="text-text-inverse mx-auto mb-4 h-10 w-10" />
        <h2
          id="home-cta-title"
          className="font-heading text-text-inverse mb-3 text-3xl font-bold"
        >
          {t('footer.cta_title')}
        </h2>
        <p className="text-footer-text mx-auto mb-8 max-w-lg text-base">
          {t('footer.cta_description')}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                navigate(routePaths.login);
                return;
              }
              navigate(routePaths.reportAnimal);
            }}
            className="bg-primary text-text-inverse flex items-center gap-2 rounded-button px-6 py-3 text-sm font-semibold shadow-lg transition-opacity hover:opacity-90"
          >
            <Camera className="h-4 w-4" />
            {t('footer.cta_button')}
          </button>
        </div>
      </div>
    </section>
  );
};
