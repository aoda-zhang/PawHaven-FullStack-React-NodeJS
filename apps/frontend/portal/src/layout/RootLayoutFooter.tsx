import { Github, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const RootLayoutFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerColumns = [
    {
      heading: t('footer.columns.platform.heading'),
      links: [
        { label: t('footer.columns.platform.browseRescues'), to: '/rescues' },
        {
          label: t('footer.columns.platform.reportStray'),
          to: '/report-stray',
        },
        { label: t('footer.columns.platform.adoptAnimal'), to: '/adopt' },
        { label: t('footer.columns.platform.volunteer'), to: '/volunteer' },
      ],
    },
    {
      heading: t('footer.columns.resources.heading'),
      links: [
        {
          label: t('footer.columns.resources.knowledgeBase'),
          to: '/knowledge',
        },
        { label: t('footer.columns.resources.rescueStories'), to: '/stories' },
        {
          label: t('footer.columns.resources.emergencyGuide'),
          to: '/emergency',
        },
      ],
    },
    {
      heading: t('footer.columns.community.heading'),
      links: [
        {
          label: t('footer.columns.community.volunteerNetwork'),
          to: '/volunteer-network',
        },
        {
          label: t('footer.columns.community.partnerShelters'),
          to: '/shelters',
        },
        { label: t('footer.columns.community.shareStory'), to: '/share-story' },
      ],
    },
    {
      heading: t('footer.columns.company.heading'),
      links: [
        { label: t('footer.columns.company.aboutPawHaven'), to: '/about' },
        { label: t('footer.columns.company.openSource'), to: '#' },
        { label: t('footer.columns.company.privacyPolicy'), to: '/privacy' },
        { label: t('footer.columns.company.termsOfService'), to: '/terms' },
      ],
    },
  ];

  const stats = [
    { emoji: '🐾', number: '2,841', label: t('footer.stats.animalsRescued') },
    { emoji: '🙌', number: '384', label: t('footer.stats.activeVolunteers') },
    { emoji: '🏠', number: '1,203', label: t('footer.stats.adopted') },
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
    <footer className="bg-surface-dark">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6">
        {/* Top: Brand + Link columns */}
        <div className="mb-12 grid gap-10 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="group mb-4 flex items-center gap-2">
              <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-105">
                <span className="text-text-inverse text-base">🐾</span>
              </div>
              <span className="font-heading text-text-inverse text-xl font-bold">
                PawHaven
              </span>
            </Link>
            <p className="text-brown-7 mb-5 text-sm leading-relaxed">
              {t('footer.brandDescription')}
            </p>
            <div className="flex gap-2">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brown-6 bg-text-inverse/10 hover:bg-text-inverse/20 hover:text-text-inverse flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  aria-label={label}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
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
                        className="text-brown-6 hover:text-text-inverse block text-left text-sm transition-colors"
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

        {/* Stats row */}
        <div className="border-text-inverse/10 mb-8 grid grid-cols-3 gap-4 border-t border-b py-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-0.5 text-xl">{stat.emoji}</div>
              <div className="font-heading text-primary mb-0.5 text-2xl leading-none font-bold">
                {stat.number}
              </div>
              <div className="text-brown-8 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="text-brown-8 flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
          <p>
            &copy; {currentYear} PawHaven. {t('footer.bottomBar.license')}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="bg-success h-2 w-2 animate-pulse rounded-full" />
            <span>{t('footer.bottomBar.systemsOperational')}</span>
            <span className="text-text-inverse/10 mx-2">|</span>
            <span>{t('footer.bottomBar.builtWith')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
