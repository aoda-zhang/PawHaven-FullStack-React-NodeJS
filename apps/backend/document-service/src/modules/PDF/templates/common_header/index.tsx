import type { JSX } from 'react';
import './index.css';

export const CommonHeader = (): JSX.Element => {
  return (
    <div className="pdf-header">
      <div className="pdf-header-brand">PawHaven</div>
      <div className="pdf-header-tagline">Animal Rescue Platform</div>
    </div>
  );
};
