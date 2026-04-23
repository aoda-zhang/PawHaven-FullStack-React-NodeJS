import { myPersonal } from '@pawhaven/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const RootLayoutFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex justify-between gap-2 text-center items-center flex-col lg:flex-row px-4 lg:px-16 py-6 bg-slate-900 text-white">
      <p className="flex flex-col justify-between items-center lg:items-start text-left">
        <span className="text-xl font-bold">{t('common.quick_links')}</span>
        <Link className="hover:text-primary transition-colors" to="/">
          {t('home.home_page')}
        </Link>
        <Link
          className="hover:text-primary transition-colors"
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
      <p className="flex flex-col justify-between items-center lg:items-start text-left">
        <span className="text-xl font-bold">{t('common.contact_me')}</span>
        <a
          href={myPersonal.github}
          className="hover:text-primary transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          {t('common.github')}
        </a>
        <a
          href={myPersonal.email}
          className="hover:text-primary transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          {t('common.email')}
        </a>
        <a
          href={myPersonal.linkedin}
          className="hover:text-primary transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          {t('common.linkedin')}
        </a>
      </p>
    </div>
  );
};
