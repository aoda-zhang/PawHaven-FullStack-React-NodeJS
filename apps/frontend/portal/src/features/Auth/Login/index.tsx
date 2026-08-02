import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@mui/material';
import { CredentialsSchema, type CredentialsDto } from '@pawhaven/shared/types';
import { FormInput } from '@pawhaven/ui';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { useLogin } from '../api/auth.mutations';
import { AuthLayout } from '../authLayout';

import { routePaths } from '@/router/routePaths';

export const Login = () => {
  const formProps = useForm<CredentialsDto>({
    resolver: zodResolver(CredentialsSchema),
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { mutate, isPending } = useLogin();

  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    routePaths.home;

  return (
    <AuthLayout>
      <div className="w-full">
        <h1 className="text-text text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('auth.login')}
        </h1>
        <p className="text-text-secondary mt-1 text-sm leading-6">
          {t('auth.login_subtitle')}
        </p>

        <FormProvider {...formProps}>
          <form
            className="mt-5 space-y-3"
            noValidate
            onSubmit={formProps.handleSubmit((data) => {
              mutate(
                {
                  email: data.email,
                  password: data.password,
                },
                {
                  onSuccess: () => navigate(from, { replace: true }),
                },
              );
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
              autoComplete="current-password"
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
              {t('auth.login')}
            </Button>
          </form>
        </FormProvider>

        <div className="text-text-secondary mt-4 text-center text-sm">
          <span>{t('auth.no_account')} </span>
          <button
            type="button"
            className="text-primary font-semibold"
            onClick={() => {
              navigate(routePaths.register);
            }}
          >
            {t('auth.register_now')}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
