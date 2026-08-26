import { Camera, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ADDITIONAL_PHOTO_SLOTS = 2;

export const StepPhotos = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-foreground mb-1 text-lg font-semibold">
        {t('reportAnimal.wizard.step1_title')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {t('reportAnimal.wizard.step1_subtitle')}
      </p>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="bg-muted border-border hover:bg-accent flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors">
          <Camera className="text-muted-foreground mb-1 h-6 w-6" />
          <span className="text-muted-foreground text-xs">
            {t('reportAnimal.wizard.step1_take_photo')}
          </span>
        </div>
        {Array.from({ length: ADDITIONAL_PHOTO_SLOTS }, (_, i) => i + 1).map(
          (i) => (
            <div
              key={i}
              className="bg-muted border-border hover:bg-accent flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors"
            >
              <Upload className="text-muted-foreground mb-1 h-5 w-5" />
              <span className="text-muted-foreground text-xs">
                {t('reportAnimal.wizard.step1_gallery')}
              </span>
            </div>
          ),
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        {t('reportAnimal.wizard.step1_hint')}
      </p>
    </div>
  );
};
