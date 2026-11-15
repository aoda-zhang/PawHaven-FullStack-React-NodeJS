import { Button } from '@pawhaven/ui';
import { useTranslation } from 'react-i18next';
import type { NavigateFunction } from 'react-router-dom';

export const Brand = ({ navigate }: { navigate: NavigateFunction }) => {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto justify-start gap-3 p-0"
      onClick={() => {
        navigate('/');
      }}
      aria-label={t('common.name')}
    >
      <img
        src="/images/logo.png"
        alt={t('common.slogan')}
        width={1110}
        height={224}
        className="h-auto w-14 lg:w-16"
      />
    </Button>
  );
};
