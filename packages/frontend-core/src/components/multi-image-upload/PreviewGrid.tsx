import { ImagePlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PreviewItem } from './defaults.js';

interface PreviewGridProps {
  previews: PreviewItem[];
  max: number;
  addLabel?: string;
  removeLabel?: string;
  onAdd: () => void;
  onRemove: (id: number) => void;
}

export const PreviewGrid = ({
  previews,
  max,
  addLabel,
  removeLabel,
  onAdd,
  onRemove,
}: PreviewGridProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-3">
      {previews.map((item) => (
        <div
          key={item.id}
          className="group border-border rounded-media relative aspect-square overflow-hidden border"
        >
          {item.url && (
            <img
              src={item.url}
              alt={item.file.name}
              className="h-full w-full object-cover"
            />
          )}
          <button
            type="button"
            aria-label={removeLabel ?? t('imageUpload.remove')}
            onClick={() => onRemove(item.id)}
            className="bg-background/80 text-error hover:bg-background absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {previews.length < max && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel ?? t('imageUpload.add')}
          className="border-border text-text-secondary hover:border-primary/40 hover:bg-muted rounded-media flex aspect-square flex-col items-center justify-center gap-1 border-2 border-dashed transition-colors"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs">{addLabel ?? t('imageUpload.add')}</span>
        </button>
      )}
    </div>
  );
};
