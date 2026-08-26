import { Camera, PawPrint, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const StrayCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section
      className="full-width border-border from-brown-10 to-brown-9 mt-4 border-t bg-gradient-to-br py-14"
      aria-labelledby="home-cta-title"
    >
      <div className="px-4 text-center sm:px-6">
        <PawPrint className="mx-auto mb-4 h-10 w-10 text-white" />
        <h2
          id="home-cta-title"
          className="font-heading mb-3 text-3xl font-bold text-white"
        >
          {t('footer.cta_title')}
        </h2>
        <p className="text-footer-text mx-auto mb-8 max-w-lg text-base">
          {t('footer.cta_description')}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/report-animal')}
            className="bg-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
          >
            <Camera className="h-4 w-4" />
            {t('footer.cta_button')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/volunteer')}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            <Zap className="h-4 w-4" />
            {t('footer.cta_button_secondary')}
          </button>
        </div>
      </div>
    </section>
  );
};
