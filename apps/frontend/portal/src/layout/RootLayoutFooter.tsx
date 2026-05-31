import { myPersonal } from '@pawhaven/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const RootLayoutFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-surface-dark text-text-inverse flex flex-col items-center justify-between gap-2 px-4 py-6 text-center lg:flex-row lg:px-16">
      <p className="flex flex-col items-center justify-between text-left lg:items-start">
        <span className="text-xl font-bold">{t('common.quick_links')}</span>
        <Link className="hover:text-primary-hover transition-colors" to="/">
          {t('home.home_page')}
        </Link>
        <Link
          className="hover:text-primary-hover transition-colors"
          to="/report-stray"
        >
          {t('common.record')}
        </Link>
      </p>
      <p
        dangerouslySetInnerHTML={{
          __html: t('common.owner_text', { year: currentYear }),
        }}
      />
      <p className="flex flex-col items-center justify-between text-left lg:items-start">
        <span className="text-xl font-bold">{t('common.contact_me')}</span>
        <a
          href={myPersonal.github}
          className="hover:text-primary-hover transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          {t('common.github')}
        </a>
        <a
          href={myPersonal.email}
          className="hover:text-primary-hover transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          {t('common.email')}
        </a>
        <a
          href={myPersonal.linkedin}
          className="hover:text-primary-hover transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          {t('common.linkedin')}
        </a>
      </p>
    </div>
  );
};
