import { Popover } from '@mui/material';
import { supportedLngs } from '@pawhaven/i18n/supportedLngs';
import clsx from 'clsx';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const shortCode = (language: string) => language.split('-')[0].toUpperCase();

interface LanguageMenuProps {
  current: string;
  onSelect: (language: string) => void;
}

const LanguageMenu = ({ current, onSelect }: LanguageMenuProps) => {
  const { t } = useTranslation();

  return (
    <ul className="flex min-w-44 flex-col gap-1" role="menu">
      {supportedLngs.map((language) => {
        const active = language === current;
        return (
          <li key={language} role="none">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={active}
              onClick={() => onSelect(language)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                active
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-secondary hover:bg-muted hover:text-text',
              )}
            >
              <span
                aria-hidden="true"
                className="bg-accent text-text-tertiary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide"
              >
                {shortCode(language)}
              </span>
              <span className="flex-1 font-medium">
                {t(`common.${language}`)}
              </span>
              {active && (
                <Check className="size-4 shrink-0" aria-hidden="true" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const current = i18n.language;

  const handleSelect = (language: string) => {
    i18n.changeLanguage(language);
    setAnchorEl(null);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('common.select_language')}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        className="border-border bg-surface text-text-secondary hover:border-border-hover hover:text-text focus-ring rounded-button inline-flex shrink-0 items-center gap-2 border px-2.5 py-1.5 text-sm shadow-sm transition-colors"
      >
        <Globe className="size-4 shrink-0" aria-hidden="true" />
        <span
          aria-hidden="true"
          className="bg-accent text-text-tertiary flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-semibold tracking-wide"
        >
          {shortCode(current)}
        </span>
        <ChevronDown
          className={clsx(
            'size-4 shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          className:
            'bg-surface border-border mt-1.5 rounded-dialog border p-1.5 shadow-dropdown',
        }}
      >
        <LanguageMenu current={current} onSelect={handleSelect} />
      </Popover>
    </>
  );
};
