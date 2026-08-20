import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../formBase.type';

export type FormCheckboxProps = Omit<BaseFormType, 'defaultValue'> & {
  defaultValue?: boolean;
  disabled?: boolean;
  className?: string;
};

export const FormCheckbox = ({
  name,
  label,
  defaultValue = false,
  disabled,
  className,
}: FormCheckboxProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('baseFormContainer', className)}>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              onBlur={field.onBlur}
              disabled={disabled}
              className="border-border bg-background accent-primary size-4 rounded"
            />
            {label && <span>{label}</span>}
          </label>
          {error && <p className="text-error mt-1 text-xs">{error.message}</p>}
        </div>
      )}
    />
  );
};
