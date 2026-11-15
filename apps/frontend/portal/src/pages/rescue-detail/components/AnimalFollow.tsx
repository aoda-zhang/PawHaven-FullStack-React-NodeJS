import { Button, Dialog } from '@pawhaven/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useGlobalContext } from '@/app/providers/GlobalProvider';
import { routePaths } from '@/app/router/routePaths';

import {
  useFollowAnimal,
  useUnfollowAnimal,
} from '../api/rescueDetail.mutations';
import { useFollowStatus } from '../api/rescueDetail.queries';

import { FollowButton } from './FollowButton';
import { FollowerCount } from './FollowerCount';

export const AnimalFollow = ({ animalId }: { animalId: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useGlobalContext();
  const { data: status, isLoading } = useFollowStatus(animalId);
  const followMutation = useFollowAnimal();
  const unfollowMutation = useUnfollowAnimal();
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const isFollowing = isAuthenticated && (status?.isFollowing ?? false);
  const isPending = followMutation.isPending || unfollowMutation.isPending;
  const isError = followMutation.isError || unfollowMutation.isError;
  const errorKey = followMutation.isError
    ? 'rescueDetail.follow_error'
    : 'rescueDetail.unfollow_error';

  const handleFollow = () => {
    if (!isAuthenticated) {
      setIsPromptOpen(true);
      return;
    }

    followMutation.mutate(animalId);
  };

  const handleUnfollow = () => unfollowMutation.mutate(animalId);

  const handleSignUp = () => {
    setIsPromptOpen(false);
    navigate(routePaths.register);
  };

  return (
    <>
      <section className="border-border bg-card rounded-card-large border p-3 shadow-sm">
        <FollowButton
          animalId={animalId}
          isFollowing={isFollowing}
          isLoading={isLoading}
          isPending={isPending}
          isError={isError}
          errorKey={errorKey}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
        />
        <FollowerCount count={status?.followerCount} isLoading={isLoading} />
      </section>
      <Dialog
        open={isPromptOpen}
        onOpenChange={setIsPromptOpen}
        title={t('rescueDetail.follow_signup_title')}
        description={t('rescueDetail.follow_signup_message')}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPromptOpen(false)}
            >
              {t('rescueDetail.follow_signup_dismiss')}
            </Button>
            <Button type="button" onClick={handleSignUp}>
              {t('rescueDetail.follow_signup_cta')}
            </Button>
          </>
        }
      />
    </>
  );
};
