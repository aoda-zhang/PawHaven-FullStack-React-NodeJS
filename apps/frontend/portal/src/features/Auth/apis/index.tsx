import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@mui/material';
import { CredentialsSchema, type CredentialsDto } from '@pawhaven/shared/types';
import { FormInput } from '@pawhaven/ui';
import { type FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { AuthLayout } from '../authLayout';

import { useRegister } from './queries';

import { routePaths } from '@/router/routePaths';

export const Register: FC = () => {
  const formProps = useForm<CredentialsDto>({
    resolver: zodResolver(CredentialsSchema),
  });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate, isPending } = useRegister();
  return (
    <AuthLayout>
      <div className="mb-5 text-center text-2xl">{t('auth.sighup')}</div>
      <FormProvider {...formProps}>
        <form>
          <FormInput
            variant="outlined"
            size="small"
            label={t('auth.email')}
            name="email"
          />
          <FormInput
            type="password"
            variant="outlined"
            size="small"
            label={t('auth.password')}
            name="password"
          />
          <Button
            loading={isPending}
            disabled={isPending}
            type="submit"
            className="w-full lg:mb-2 lg:min-w-[30vw]"
            variant="contained"
            onClick={formProps.handleSubmit((data) => {
              mutate({
                email: data.email,
                password: data.password,
              });
            })}
          >
            {t('auth.sighup')}
          </Button>
        </form>
      </FormProvider>
      <p className="mt-5 text-right">
        <span className="mr-3 text-gray-400">{t('auth.with_account')}</span>
        <Button
          type="button"
          className="text-primary cursor-pointer"
          onClick={() => {
            navigate(routePaths.login);
          }}
        >
          {t('auth.login_now')}
        </Button>
      </p>
    </AuthLayout>
  );
};
