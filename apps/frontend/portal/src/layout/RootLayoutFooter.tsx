import { Brand } from '@pawhaven/frontend-core';
import { Github, Home, Mail, PawPrint, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useInRouterContext, useNavigate } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';

const FooterLink = ({
  to,
  className,
  label,
}: {
  to: string;
  className: string;
  label: string;
}) => {
  const inRouter = useInRouterContext();
  return inRouter ? (
    <Link to={to} className={className}>
      {label}
    </Link>
  ) : (
    <a href={to} className={className}>
      {label}
    </a>
  );
};

const RouterBrand = () => <Brand navigate={useNavigate()} />;

const StandaloneBrand = () => {
  const goHome: NavigateFunction = () => {
    window.location.assign('/');
  };
  return <Brand navigate={goHome} />;
};

const FooterBrand = () => {
  const inRouter = useInRouterContext();
  return inRouter ? <RouterBrand /> : <StandaloneBrand />;
};

export const RootLayoutFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerColumns = [
    {
      heading: t('footer.columns.platform.heading'),
      links: [
        { label: t('footer.columns.platform.browse_rescues'), to: '/rescues' },
        {
          label: t('footer.columns.platform.report_animal'),
          to: '/report-animal',
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
    <footer className="bg-footer-bg">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6">
        <div className="mb-12 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <FooterBrand />
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
                      <FooterLink
                        to={link.to}
                        className="text-footer-text block text-left text-sm transition-colors hover:text-white"
                        label={link.label}
                      />
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
  );
};
