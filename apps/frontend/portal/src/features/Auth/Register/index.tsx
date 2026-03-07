import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@mui/material';
import { CredentialsSchema } from '@pawhaven/shared/types';
import { FormInput } from '@pawhaven/ui';
import { type FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useRegister } from '../apis/queries';
import { AuthLayout } from '../authLayout';

import { routePaths } from '@/router/routePaths';

export const Register: FC = () => {
  const formProps = useForm({
    resolver: zodResolver(CredentialsSchema),
  });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate, isPending } = useRegister();
  return (
    <AuthLayout>
      <div className="text-2xl mb-5 text-center">{t('auth.sighup')}</div>
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
            className="w-full lg:min-w-[30vw] lg:mb-2"
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
      <p className="text-right mt-5">
        <span className="text-gray-400 mr-3">{t('auth.with_account')}</span>
        <Button
          type="button"
          className="cursor-pointer text-primary"
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
