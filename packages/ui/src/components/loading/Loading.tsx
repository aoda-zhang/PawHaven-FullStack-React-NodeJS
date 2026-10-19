import { Lottie } from 'lottie-react';

import animationData from './loading.json';

export interface LoadingProps {
  label?: string;
  className?: string;
}

export const Loading = ({
  label = 'Loading',
  className,
}: LoadingProps) => {
  return (
    <div
      className={className ?? 'fixed inset-0 flex items-center justify-center'}
      role="status"
      aria-label={label}
    >
      <Lottie
        src={animationData}
        loop
        autoplay
        aria-hidden="true"
        className="size-16"
      />
    </div>
  );
};
