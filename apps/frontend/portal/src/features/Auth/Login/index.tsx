import { zodResolver } from '@hookform/resolvers/zod/dist/zod.js';
import { Button } from '@mui/material';
import { FormInput } from '@pawhaven/ui';
import { type FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useLogin } from '../apis/queries';
import { AuthLayout } from '../authLayout';

import { routePaths } from '@/router/routePaths';

export const Login: FC = () => {
  const formProps = useForm({
    resolver: zodResolver(CredentialsSchema),
  });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate, isPending } = useLogin();
  return (
    <AuthLayout>
      <div className="text-2xl mb-5 text-center">{t('auth.login')}</div>
      <FormProvider {...formProps}>
        <form>
          <FormInput
            variant="outlined"
            size="small"
            label={t('auth.email')}
            name="email"
            required
          />
          <FormInput
            type="password"
            variant="outlined"
            size="small"
            label={t('auth.password')}
            name="password"
            required
          />
          <Button
            loading={isPending}
            disabled={isPending}
            type="submit"
            className="w-full lg:min-w-[30vw] lg:mb-2"
            variant="contained"
            onClick={formProps.handleSubmit((data) => {
              mutate({
                email: data?.email,
                password: data?.password,
              });
            })}
          >
            {t('auth.login')}
          </Button>
        </form>
      </FormProvider>
      <p className="text-right mt-5">
        <span className="text-gray-400 mr-3">{t('auth.no_account')}</span>
        <Button
          type="button"
          className="cursor-pointer text-primary"
          onClick={() => {
            navigate(routePaths.register);
          }}
        >
          {t('auth.register_now')}
        </Button>
      </p>
    </AuthLayout>
  );
};
