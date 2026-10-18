import { useTranslation } from 'react-i18next';

interface FollowerCountProps {
  count?: number;
  isLoading?: boolean;
}

export const FollowerCount = ({
  count,
  isLoading = false,
}: FollowerCountProps) => {
  const { t } = useTranslation();

  if (isLoading || count == null) {
    return null;
  }

  return (
    <p className="text-text-secondary mt-2 text-center text-xs">
      {t('rescueDetail.followers_count', { count })}
    </p>
  );
};
