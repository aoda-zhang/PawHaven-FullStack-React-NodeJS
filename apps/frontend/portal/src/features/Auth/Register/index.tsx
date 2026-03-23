import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@mui/material';
import { CredentialsSchema, type CredentialsDto } from '@pawhaven/shared/types';
import { FormInput } from '@pawhaven/ui';
import { Chrome, Github } from 'lucide-react';
import { type FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useRegister } from '../apis/queries';
import { AuthLayout } from '../authLayout';

import { routePaths } from '@/router/routePaths';

export const Register: FC = () => {
  const formProps = useForm<CredentialsDto>({
    resolver: zodResolver(CredentialsSchema),
  });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate, isPending } = useRegister();

  const handleSSOLogin = () => {};

  return (
    <AuthLayout>
      <div className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {t('auth.sighup')}
        </h1>
        <p className="mt-1 text-sm leading-6 text-text-secondary">
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

        <div className="my-4 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-text-secondary">
          <div className="h-px flex-1 bg-border" />
          <span>{t('auth.or')}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          fullWidth
          type="button"
          variant="outlined"
          startIcon={<Chrome size={18} />}
          className="!h-11 !rounded-full !border-border !text-sm !font-semibold !text-text"
          onClick={handleSSOLogin}
        >
          {t('auth.continueWithGoogle')}
        </Button>

        <Button
          fullWidth
          type="button"
          variant="outlined"
          startIcon={<Github size={18} />}
          className="!mt-2 !h-11 !rounded-full !border-border !text-sm !font-semibold !text-text"
          onClick={handleSSOLogin}
        >
          {t('auth.continueWithGithub')}
        </Button>

        <div className="mt-4 text-center text-sm text-text-secondary">
          <span>{t('auth.with_account')} </span>
          <button
            type="button"
            className="font-semibold text-primary"
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
