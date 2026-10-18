import { useTranslation } from 'react-i18next';

import { RescueGuideDownloads } from './components/RescueGuideDownloads';
import { RescueSteps } from './components/RescueSteps';

export const RescueGuide = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="bg-hero-bg border-border rounded-3xl border p-6 sm:p-8">
        <span className="text-stat-labels text-xs font-semibold tracking-widest uppercase">
          {t('rescueGuide.eyebrow')}
        </span>
        <h1 className="text-dark-text mt-2 text-3xl font-bold sm:text-4xl">
          {t('rescueGuide.title')}
        </h1>
        <p className="text-body-text mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
          {t('rescueGuide.intro')}
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-text text-xl font-semibold">
          {t('rescueGuide.steps_title')}
        </h2>
        <div className="mt-5">
          <RescueSteps />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-text text-xl font-semibold">
          {t('rescueGuide.documents_title')}
        </h2>
        <div className="mt-5">
          <RescueGuideDownloads />
        </div>
      </section>
    </div>
  );
};
