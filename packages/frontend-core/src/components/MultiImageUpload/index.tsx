import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../utils';

export interface MultiImageUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
  max?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  accept?: string;
  required?: boolean;
  label?: string;
  hint?: string;
  addLabel?: string;
  removeLabel?: string;
  className?: string;
}

interface PreviewItem {
  file: File;
  url: string;
}

const DEFAULT_MAX = 5;
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const DEFAULT_MAX_SIZE_MB = 10;
const DEFAULT_MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_MB * BYTES_PER_MB;
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const DEFAULT_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png';
const EMPTY_FILES: File[] = [];

const toObjectUrl = (file: File): string => {
  try {
    return URL.createObjectURL(file);
  } catch {
    return '';
  }
};

export const MultiImageUpload = ({
  value,
  onChange,
  error,
  max = DEFAULT_MAX,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  accept = DEFAULT_ACCEPT,
  required = false,
  label,
  hint,
  addLabel,
  removeLabel,
  className,
}: MultiImageUploadProps) => {
  const { t } = useTranslation();
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const [localError, setLocalError] = useState('');
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const previewsRef = useRef<PreviewItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const files = value ?? EMPTY_FILES;
  const maxSizeMb = Math.floor(maxSizeBytes / BYTES_PER_MB);

  useEffect(() => {
    const previous = previewsRef.current;
    const next = files.map((file) => {
      const existing = previous.find((item) => item.file === file);
      return existing ?? { file, url: toObjectUrl(file) };
    });

    previous.forEach((item) => {
      const kept = next.some((candidate) => candidate.file === item.file);
      if (!kept && item.url) {
        URL.revokeObjectURL(item.url);
      }
    });

    previewsRef.current = next;
    setPreviews((current) => {
      const unchanged =
        current.length === next.length &&
        current.every((item, index) => item === next[index]);
      return unchanged ? current : next;
    });
  }, [files]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
      previewsRef.current = [];
    };
  }, []);

  const addFiles = (incoming: File[]) => {
    setLocalError('');
    if (incoming.length === 0) return;
    if (files.length + incoming.length > max) {
      setLocalError(t('imageUpload.too_many', { max }));
      return;
    }
    const results = incoming.map((file) => {
      if (!acceptedTypes.includes(file.type)) {
        return { file, problem: 'format' as const };
      }
      if (file.size > maxSizeBytes) {
        return { file, problem: 'size' as const };
      }
      return { file, problem: null };
    });

    const firstProblem = results.find((item) => item.problem !== null);
    if (firstProblem?.problem === 'format') {
      setLocalError(t('imageUpload.format'));
    } else if (firstProblem?.problem === 'size') {
      setLocalError(t('imageUpload.size', { maxSize: maxSizeMb }));
    }

    const accepted = results
      .filter((item) => item.problem === null)
      .map((item) => item.file);
    if (accepted.length > 0) {
      onChange([...files, ...accepted]);
    }
  };

  const removeFile = (index: number) => {
    setLocalError('');
    onChange(files.filter((_, i) => i !== index));
  };

  const resolvedError = error ?? localError;
  const describedBy =
    [hint ? hintId : '', resolvedError ? errorId : '']
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          {label}
          {required && (
            <span className="text-error ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {hint && (
        <p id={hintId} className="text-muted-foreground mb-3 text-xs">
          {hint}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        {previews.map((item, index) => (
          <div
            key={`${item.file.name}-${index}`}
            className="group border-border relative aspect-square overflow-hidden rounded-xl border"
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
              onClick={() => removeFile(index)}
              className="bg-background/80 text-error hover:bg-background absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {previews.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label={addLabel ?? t('imageUpload.add')}
            className="border-border text-muted-foreground hover:border-primary/40 hover:bg-muted flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">{addLabel ?? t('imageUpload.add')}</span>
          </button>
        )}
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        {t('imageUpload.count', { count: previews.length, max })}
      </p>
      {resolvedError && (
        <p
          id={errorId}
          className={cn(
            'mt-1 text-xs',
            error ? 'text-error' : 'text-muted-foreground',
          )}
        >
          {resolvedError}
        </p>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple
        hidden
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        }}
      />
    </div>
  );
};
