import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import type { BaseFormType } from '../formBase.type';

interface Option {
  value: string;
  label: string;
}

interface FormRadioProps {
  options: Option[];
}

export const FormRadio = ({
  name,
  label,
  options,
  required,
}: BaseFormType & FormRadioProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className={clsx('baseFormContainer')}>
      <p className="mb-3">{label}</p>
      {options.map((option) => (
        <label
          key={option.value}
          className="mb-[.625rem] flex cursor-pointer items-center text-[1rem]"
          htmlFor={`${name}-${option.value}`}
        >
          <input
            id={`${name}-${option.value}`}
            type="radio"
            value={option.value}
            {...register(
              name,
              required ? { required: 'This field is required' } : {},
            )}
            className={clsx('mr-[.5rem]')}
          />
          {option.label}
        </label>
      ))}
      {errors[name] && (
        <span className="formErrorMessage">
          {errors[name]?.message?.toString()}
        </span>
      )}
    </div>
  );
};
