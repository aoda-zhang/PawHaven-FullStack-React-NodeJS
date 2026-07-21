import { useTranslation } from 'react-i18next';

interface UrgencyBadgeProps {
  urgency: 'high' | 'normal';
}

export const UrgencyBadge = ({ urgency }: UrgencyBadgeProps) => {
  const { t } = useTranslation();

  if (urgency === 'high') {
    return (
      <span className="bg-error-light text-error rounded-full px-2 py-0.5 text-xs font-semibold">
        {t('rescue_cases.urgency_high')}
      </span>
    );
  }

  return null;
};
