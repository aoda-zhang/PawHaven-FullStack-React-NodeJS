import { Button } from '@pawhaven/ui';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FollowButtonProps {
  animalId: string;
  isFollowing: boolean;
  isLoading?: boolean;
  isPending?: boolean;
  hasError?: boolean;
  errorKey?: string;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

export const FollowButton = ({
  isFollowing,
  isLoading = false,
  isPending = false,
  hasError = false,
  errorKey = '',
  onFollow,
  onUnfollow,
}: FollowButtonProps) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (isFollowing && onUnfollow) {
      onUnfollow();
      return;
    }
    if (!isFollowing && onFollow) {
      onFollow();
    }
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
        {t(isFollowing ? 'rescueDetail.following' : 'rescueDetail.follow')}
      </Button>
      {hasError && (
        <p role="alert" className="text-error text-center text-xs">
          {t(errorKey || 'rescueDetail.follow_error')}
        </p>
      )}
    </div>
  );
};
