import type { ReactNode } from 'react';

export interface InfoTileProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export const InfoTile = ({ label, value, className }: InfoTileProps) => {
  return (
    <div
      className={`bg-background-soft flex flex-col gap-0.5 rounded-xl p-3${className ? ` ${className}` : ''}`}
    >
      <span className="text-text-secondary text-xs">{label}</span>
      <span className="text-foreground text-sm">{value}</span>
    </div>
  );
};
