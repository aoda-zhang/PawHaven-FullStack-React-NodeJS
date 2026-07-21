import { Brand } from '@pawhaven/frontend-core';
import { Camera, Github, Home, Mail, PawPrint, Users, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

export const RootLayoutFooter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerColumns = [
    {
      heading: t('footer.columns.platform.heading'),
      links: [
        { label: t('footer.columns.platform.browse_rescues'), to: '/rescues' },
        {
          label: t('footer.columns.platform.report_stray'),
          to: '/report-stray',
        },
        { label: t('footer.columns.platform.adopt_animal'), to: '/adopt' },
        { label: t('footer.columns.platform.volunteer'), to: '/volunteer' },
      ],
    },
    {
      heading: t('footer.columns.resources.heading'),
      links: [
        {
          label: t('footer.columns.resources.knowledge_base'),
          to: '/knowledge',
        },
        {
          label: t('footer.columns.resources.medication_library'),
          to: '/medication',
        },
        { label: t('footer.columns.resources.rescue_stories'), to: '/stories' },
        {
          label: t('footer.columns.resources.emergency_guide'),
          to: '/emergency',
        },
      ],
    },
    {
      heading: t('footer.columns.community.heading'),
      links: [
        {
          label: t('footer.columns.community.volunteer_network'),
          to: '/volunteer-network',
        },
        {
          label: t('footer.columns.community.partner_shelters'),
          to: '/shelters',
        },
        {
          label: t('footer.columns.community.share_story'),
          to: '/share-story',
        },
      ],
    },
    {
      heading: t('footer.columns.company.heading'),
      links: [
        { label: t('footer.columns.company.about_pawhaven'), to: '/about' },
        { label: t('footer.columns.company.open_source'), to: '#' },
        { label: t('footer.columns.company.privacy_policy'), to: '/privacy' },
        { label: t('footer.columns.company.terms_of_service'), to: '/terms' },
      ],
    },
  ];

  const stats = [
    {
      icon: <PawPrint className="mx-auto h-5 w-5" />,
      number: '2,841',
      label: t('footer.stats.animals_rescued'),
    },
    {
      icon: <Users className="mx-auto h-5 w-5" />,
      number: '384',
      label: t('footer.stats.active_volunteers'),
    },
    {
      icon: <Home className="mx-auto h-5 w-5" />,
      number: '1,203',
      label: t('footer.stats.adopted'),
    },
  ];

  const socialLinks = [
    {
      icon: Github,
      label: t('footer.social.github'),
      href: 'https://github.com/aoda-zhang',
    },
    {
      icon: Mail,
      label: t('footer.social.email'),
      href: 'mailto:aoda.zhang.work@gmail.com',
    },
  ];

  return (
    <>
      <section
        className="border-border from-brown-10 to-brown-9 mt-4 border-t bg-gradient-to-br py-14"
        aria-labelledby="footer-cta-title"
      >
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <PawPrint className="mx-auto mb-4 h-10 w-10 text-white" />
          <h2
            id="footer-cta-title"
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
              onClick={() => navigate('/report-stray')}
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

      <footer className="bg-footer-bg">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6">
          <div className="mb-12 grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <Brand navigate={navigate} />
              <p className="text-brown-7 mt-4 text-sm leading-relaxed">
                {t('footer.brand_description')}
              </p>
              <div className="mt-5 flex gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    title={social.label}
                    aria-label={social.label}
                    className="text-brown-7 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
              {footerColumns.map((column) => (
                <div key={column.heading}>
                  <h4 className="text-brown-7 mb-4 text-xs font-semibold tracking-widest uppercase">
                    {column.heading}
                  </h4>
                  <ul className="flex flex-col gap-2.5">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          className="text-footer-text block text-left text-sm transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-4 border-t border-b border-white/10 py-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-0.5">{stat.icon}</div>
                <div className="font-heading text-primary mb-0.5 text-2xl leading-none font-bold">
                  {stat.number}
                </div>
                <div className="text-footer-muted text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="text-footer-muted flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
            <p>
              &copy; {currentYear} PawHaven. {t('footer.bottom_bar.license')}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="bg-success h-2 w-2 animate-pulse rounded-full" />
              <span>{t('footer.bottom_bar.systems_operational')}</span>
              <span className="mx-2 text-white/10">|</span>
              <span>{t('footer.bottom_bar.built_with')}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
