import { useEffect, useRef, useState } from 'react';
import { Button } from '@pawhaven/ui';
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  const isFollowing = isAuthenticated && (status?.isFollowing ?? false);
  const isPending = followMutation.isPending || unfollowMutation.isPending;
  const isError = followMutation.isError || unfollowMutation.isError;
  const errorKey = followMutation.isError
    ? 'rescueDetail.follow_error'
    : 'rescueDetail.unfollow_error';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isPromptOpen && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } else if (!isPromptOpen && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [isPromptOpen]);

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

      <dialog
        ref={dialogRef}
        aria-labelledby="animal-follow-signup-title"
        aria-describedby="animal-follow-signup-description"
        onCancel={(event) => {
          event.preventDefault();
          setIsPromptOpen(false);
        }}
        onClose={() => setIsPromptOpen(false)}
        className="bg-card text-foreground border-border fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-card-large border p-6 shadow-xl backdrop:bg-foreground/50"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h2
              id="animal-follow-signup-title"
              className="text-foreground text-lg font-semibold"
            >
              {t('rescueDetail.follow_signup_title')}
            </h2>
            <p
              id="animal-follow-signup-description"
              className="text-text-secondary text-sm leading-6"
            >
              {t('rescueDetail.follow_signup_message')}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsPromptOpen(false)}
              className="border-border text-foreground hover:bg-background-subtle rounded-button-large cursor-pointer border px-4 py-2 text-sm font-medium transition-colors"
            >
              {t('rescueDetail.follow_signup_dismiss')}
            </button>
            <Button type="button" onClick={handleSignUp}>
              {t('rescueDetail.follow_signup_cta')}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
};
