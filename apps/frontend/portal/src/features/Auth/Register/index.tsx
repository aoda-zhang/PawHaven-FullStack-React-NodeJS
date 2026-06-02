import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@mui/material';
import { CredentialsSchema, type CredentialsDto } from '@pawhaven/shared/types';
import { FormInput } from '@pawhaven/ui';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useRegister } from '../apis/queries';
import { AuthLayout } from '../authLayout';

import { routePaths } from '@/router/routePaths';

export const Register = () => {
  const formProps = useForm<CredentialsDto>({
    resolver: zodResolver(CredentialsSchema),
  });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate, isPending } = useRegister();

  return (
    <AuthLayout>
      <div className="w-full">
        <h1 className="text-text text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('auth.sighup')}
        </h1>
        <p className="text-text-secondary mt-1 text-sm leading-6">
          {t('auth.registerSubtitle')}
        </p>

        <FormProvider {...formProps}>
          <form
            className="mt-5 space-y-3"
            noValidate
            onSubmit={formProps.handleSubmit((data) => {
              mutate({
                email: data.email,
                password: data.password,
              });
            })}
          >
            <FormInput
              variant="standard"
              size="small"
              label={t('auth.email')}
              name="email"
              type="email"
              required
              placeholder={t('auth.email')}
              autoComplete="email"
            />
            <FormInput
              type="password"
              variant="standard"
              size="small"
              label={t('auth.password')}
              name="password"
              required
              placeholder={t('auth.password')}
              autoComplete="new-password"
            />
            <Button
              loading={isPending}
              disabled={isPending}
              type="submit"
              fullWidth
              color="primary"
              disableElevation
              className="!mt-4 !h-11 !rounded-full !text-sm !font-semibold"
              variant="contained"
            >
              {t('auth.sighup')}
            </Button>
          </form>
        </FormProvider>

        <div className="text-text-secondary mt-4 text-center text-sm">
          <span>{t('auth.with_account')} </span>
          <button
            type="button"
            className="text-primary font-semibold"
            onClick={() => {
              navigate(routePaths.login);
            }}
          >
            {t('auth.login_now')}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
