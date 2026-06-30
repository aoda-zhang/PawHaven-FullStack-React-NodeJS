import {
  Checkbox,
  FormControlLabel,
  FormHelperText,
  type CheckboxProps,
} from '@mui/material';
import clsx from 'clsx';
import { Controller, useFormContext } from 'react-hook-form';

import type { BaseFormType } from '../formBase.type';

export const FormCheckbox = ({
  name,
  label,
  defaultValue,
  ...props
}: BaseFormType &
  Omit<CheckboxProps, 'defaultValue'> & { defaultValue?: boolean }) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => (
        <div className={clsx([props.className, 'baseFormContainer'])}>
          <FormControlLabel
            control={
              <Checkbox
                {...props}
                {...field}
                checked={!!field.value}
                onChange={(_e, checked) => field.onChange(checked)}
              />
            }
            label={label}
          />
          {error && <FormHelperText error>{error.message}</FormHelperText>}
        </div>
      )}
    />
  );
};
