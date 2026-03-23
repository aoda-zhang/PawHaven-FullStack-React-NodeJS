import { Popover } from '@mui/material';
import { supportedLngs } from '@pawhaven/i18n/supportedLngs';
import { ChevronDown, Globe } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelect = () => {
  const { i18n, t } = useTranslation();
  const setLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="flex flex-col gap-[.625rem] text-[.875rem] p-[.625rem] text-gray-600 border-gray-400 rounded-[10%] border">
      {supportedLngs.map((item) => (
        <button
          key={item}
          className="cursor-pointer text-left hover:border-b hover:border-gray-500"
          onClick={() => setLanguage(item)}
          type="button"
        >
          {t(`common.${item}`)}
        </button>
      ))}
    </div>
  );
};

export const I18nSwitch = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setAnchorEl(event.currentTarget);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <div className="shrink-0 rounded-full border border-border bg-white px-[2px] py-1 shadow-sm">
        <div
          className="flex items-center justify-center gap-[.625rem] cursor-pointer min-w-[12.5rem] mb-0 px-2 py-1 text-sm"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <Globe />
          {t(`common.${i18n.language}`)}
          <ChevronDown size={26} />
        </div>
      </div>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        PaperProps={{
          className: 'p-2 bg-white rounded-lg shadow-lg ml-9 mt-1',
        }}
        disableScrollLock
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <LanguageSelect />
      </Popover>
    </>
  );
};

export const LanguageSelector = I18nSwitch;
