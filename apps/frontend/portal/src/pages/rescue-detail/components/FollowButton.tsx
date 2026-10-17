import { Button } from '@pawhaven/ui';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useFollowAnimal,
  useUnfollowAnimal,
} from '../api/animalFollow.mutations';
import { useFollowStatus } from '../api/animalFollow.queries';

interface FollowButtonProps {
  animalId: string;
}

export const FollowButton = ({ animalId }: FollowButtonProps) => {
  const { t } = useTranslation();
  const { data: status, isLoading } = useFollowStatus(animalId);
  const followMutation = useFollowAnimal();
  const unfollowMutation = useUnfollowAnimal();

  const isFollowing = status?.isFollowing ?? false;
  const isPending = followMutation.isPending || unfollowMutation.isPending;
  const hasError = followMutation.isError || unfollowMutation.isError;
  const errorKey = followMutation.isError
    ? 'animalFollow.follow_error'
    : 'animalFollow.unfollow_error';

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate(animalId);
      return;
    }
    followMutation.mutate(animalId);
  };

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={isFollowing ? 'secondary' : 'outline'}
        className="w-full"
        loading={isPending}
        disabled={isLoading}
        aria-pressed={isFollowing}
        onClick={handleClick}
      >
        {isFollowing ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" />
        )}
        {t(isFollowing ? 'animalFollow.following' : 'animalFollow.follow')}
      </Button>
      {hasError && (
        <p role="alert" className="text-error text-center text-xs">
          {t(errorKey)}
        </p>
      )}
    </div>
  );
};
