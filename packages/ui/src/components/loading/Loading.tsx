import { Lottie } from 'lottie-react';

import animationData from './loading.json';

export const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <Lottie src={animationData} loop autoplay className="size-16" />
    </div>
  );
};
