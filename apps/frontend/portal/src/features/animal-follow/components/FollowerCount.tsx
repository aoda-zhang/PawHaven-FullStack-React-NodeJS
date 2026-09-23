import { useTranslation } from 'react-i18next';

import { useFollowStatus } from '../api/animalFollow.queries';

interface FollowerCountProps {
  animalId: string;
}

export const FollowerCount = ({ animalId }: FollowerCountProps) => {
  const { t } = useTranslation();
  const { data } = useFollowStatus(animalId);

  if (!data) {
    return null;
  }

  return (
    <p className="text-text-secondary mt-2 text-center text-xs">
      {t('animalFollow.followers_count', { count: data.followerCount })}
    </p>
  );
};
