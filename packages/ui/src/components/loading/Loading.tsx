import { useSyncExternalStore } from 'react';
import { Lottie } from 'lottie-react';

import animationData from './loading.json';

export interface LoadingProps {
  label?: string;
  className?: string;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeToMotionPreference = (onChange: () => void) => {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
};

const getMotionPreference = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

const getServerMotionPreference = () => false;

export const Loading = ({ label = 'Loading', className }: LoadingProps) => {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  );

  return (
    <div
      className={className ?? 'fixed inset-0 flex items-center justify-center'}
      role="status"
      aria-label={label}
    >
      {prefersReducedMotion ? (
        <span className="text-text-secondary text-sm">{label}</span>
      ) : (
        <Lottie
          src={animationData}
          loop
          autoplay
          aria-hidden="true"
          className="size-16"
        />
      )}
    </div>
  );
};
