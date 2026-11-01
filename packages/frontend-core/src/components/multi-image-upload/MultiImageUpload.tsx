import { cn } from '@pawhaven/ui';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  BYTES_PER_MB,
  DEFAULT_ACCEPT,
  DEFAULT_ACCEPTED_TYPES,
  DEFAULT_MAX,
  DEFAULT_MAX_SIZE_BYTES,
  EMPTY_FILES,
  type PreviewItem,
} from './defaults.js';
import { PreviewGrid } from './PreviewGrid.js';

export interface MultiImageUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
  max?: number;
  maxSizeBytes?: number;
  acceptedTypes?: readonly string[];
  accept?: string;
  required?: boolean;
  label?: string;
  hint?: string;
  addLabel?: string;
  removeLabel?: string;
  className?: string;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const idByFileRef = useRef(new WeakMap<File, number>());
  const nextIdRef = useRef(0);

  const files = value ?? EMPTY_FILES;
  const maxSizeMb = Math.floor(maxSizeBytes / BYTES_PER_MB);

  useEffect(() => {
    const idByFile = idByFileRef.current;
    const revokeFns: Array<() => void> = [];

    const next = files.map((file) => {
      let id = idByFile.get(file);
      if (id === undefined) {
        nextIdRef.current += 1;
        id = nextIdRef.current;
        idByFile.set(file, id);
      }
      let url = '';
      try {
        const objectUrl = URL.createObjectURL(file);
        revokeFns.push(() => URL.revokeObjectURL(objectUrl));
        url = objectUrl;
      } catch {
        url = '';
      }
      return { id, file, url };
    });

    setPreviews(() => next);

    return () => {
      revokeFns.forEach((revoke) => revoke());
    };
  }, [files]);

  const addFiles = (incoming: File[]) => {
    setLocalError('');
    if (incoming.length === 0) return;
    if (files.length + incoming.length > max) {
      setLocalError(t('imageUpload.too_many', { max }));
      return;
    }

    const acceptedTypeSet = new Set(acceptedTypes);
    const results = incoming.map((file) => {
      if (!acceptedTypeSet.has(file.type)) {
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

    const accepted: File[] = [];
    results.forEach((result) => {
      if (result.problem === null) {
        accepted.push(result.file);
      }
    });
    if (accepted.length > 0) {
      onChange([...files, ...accepted]);
    }
  };

  const removeFile = (id: number) => {
    setLocalError('');
    const remaining: File[] = [];
    previews.forEach((item) => {
      if (item.id !== id) {
        remaining.push(item.file);
      }
    });
    onChange(remaining);
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
        <p id={hintId} className="text-text-secondary mb-3 text-xs">
          {hint}
        </p>
      )}
      <PreviewGrid
        previews={previews}
        max={max}
        addLabel={addLabel}
        removeLabel={removeLabel}
        onAdd={() => inputRef.current?.click()}
        onRemove={removeFile}
      />
      <p className="text-text-secondary mt-2 text-xs">
        {t('imageUpload.count', { count: previews.length, max })}
      </p>
      {resolvedError && (
        <p
          id={errorId}
          className={cn(
            'mt-1 text-xs',
            error ? 'text-error' : 'text-text-secondary',
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
