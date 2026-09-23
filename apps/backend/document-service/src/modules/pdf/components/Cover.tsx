import type { ReactElement } from 'react';

export interface CoverProps {
  title: string;
  subtitle: string;
}

export const Cover = ({ title, subtitle }: CoverProps): ReactElement => (
  <div className="from-yellow-6 via-yellow-7 to-brown-9 relative flex min-h-screen break-after-page flex-col justify-end bg-gradient-to-br px-10 py-14 text-white">
    <div className="absolute inset-0 flex items-center justify-center">
      <h1 className="text-display m-0 leading-tight font-bold [writing-mode:vertical-rl]">
        {title}
      </h1>
    </div>

    <p className="text-text-inverse/90 m-0 max-w-xs text-base leading-relaxed">
      {subtitle}
    </p>
  </div>
);
