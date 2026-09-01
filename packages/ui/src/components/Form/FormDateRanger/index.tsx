import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../formBase.type';

type DateRangeValue = [string | null, string | null] | null;

export type FormDateRangerProps = BaseFormType & {
  fullWidth?: boolean;
};

export const FormDateRanger = ({
  name,
  label,
  defaultValue,
  fullWidth = true,
  className,
}: FormDateRangerProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        const raw: unknown = field.value;
        const value: DateRangeValue = Array.isArray(raw)
          ? ([raw[0] ?? null, raw[1] ?? null] as DateRangeValue)
          : null;
        const update = (index: 0 | 1, next: string) => {
          const current = value ?? [null, null];
          field.onChange(index === 0 ? [next, current[1]] : [current[0], next]);
        };

        return (
          <div
            className={cn(
              'baseFormContainer',
              className,
              fullWidth && 'w-full',
            )}
          >
            {label && <div className="mb-2 text-sm font-medium">{label}</div>}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={value?.[0] ?? ''}
                onChange={(e) => update(0, e.target.value)}
                aria-label={label ? `${label} start` : 'Start date'}
                className="border-border bg-background focus:border-primary text-text w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none"
              />
              <span className="text-text-secondary">–</span>
              <input
                type="date"
                value={value?.[1] ?? ''}
                onChange={(e) => update(1, e.target.value)}
                aria-label={label ? `${label} end` : 'End date'}
                className="border-border bg-background focus:border-primary text-text w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none"
              />
            </div>
            {error && (
              <p className="text-error mt-1 text-xs">{error.message}</p>
            )}
          </div>
        );
      }}
    />
  );
};
