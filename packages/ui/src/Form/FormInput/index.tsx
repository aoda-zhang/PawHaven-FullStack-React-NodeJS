import {
  TextField,
  InputAdornment,
  IconButton,
  type TextFieldProps,
} from '@mui/material';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import type { BaseFormType, BaseTextFieldType } from '../formBase.type';

export const FormInput: React.FC<
  BaseFormType & TextFieldProps & BaseTextFieldType
> = ({
  name,
  label,
  defaultValue = '',
  type = 'text',
  fullWidth = true,
  showPasswordToggle = true,
  ...props
}) => {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = React.useState(false);

  const isPasswordType = type === 'password';
  const shouldShowToggle = isPasswordType && showPasswordToggle;
  const passwordInputType =
    shouldShowToggle && showPassword ? 'text' : 'password';
  const inputType: TextFieldProps['type'] = isPasswordType
    ? passwordInputType
    : type;

  const handleToggleShow = () => setShowPassword((s) => !s);
  const handleMouseDown = (e: React.MouseEvent) => e.preventDefault();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        const { InputProps: passedInputProps, ...restProps } = props;
        const endAdornment = shouldShowToggle ? (
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={handleToggleShow}
              onMouseDown={handleMouseDown}
              edge="end"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </IconButton>
          </InputAdornment>
        ) : undefined;

        return (
          <div className={clsx([props?.className, 'baseFormContainer'])}>
            <div className="mb-3">{label}</div>
            <TextField
              {...field}
              {...restProps}
              fullWidth={fullWidth}
              variant={props?.variant ?? 'outlined'}
              required={props?.required}
              error={!!error}
              type={inputType}
              helperText={error?.message}
              InputProps={{
                ...passedInputProps,
                endAdornment: endAdornment ?? passedInputProps?.endAdornment,
              }}
            />
          </div>
        );
      }}
    />
  );
};
