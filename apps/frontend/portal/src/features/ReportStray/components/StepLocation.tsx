import { MapPin } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';

interface StepLocationProps {
  address: string;
  onAddressChange: (address: string) => void;
}

export const StepLocation: React.FC<StepLocationProps> = ({
  address,
  onAddressChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-foreground mb-1 text-lg font-semibold">
        {t('reportStray.wizard.step2_title')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {t('reportStray.wizard.step2_subtitle')}
      </p>
      <div className="bg-muted border-border mb-4 flex h-40 items-center justify-center rounded-xl border">
        <div className="text-center">
          <MapPin className="text-primary mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            {t('reportStray.wizard.step2_map_placeholder')}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="text-primary hover:bg-primary-light mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-current py-2.5 text-sm font-medium transition-colors"
      >
        <MapPin className="h-4 w-4" />
        {t('reportStray.wizard.step2_use_current')}
      </button>
      <div>
        <label className="text-foreground mb-1.5 block text-sm font-medium">
          {t('reportStray.wizard.step2_landmark_label')}
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t('reportStray.wizard.step2_landmark_hint')}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
    </div>
  );
};
