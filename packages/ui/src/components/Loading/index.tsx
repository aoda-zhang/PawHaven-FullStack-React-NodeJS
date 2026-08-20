import { Loader2 } from 'lucide-react';

export const Loading = () => {
  return (
    <div
      className="bg-background/40 fixed inset-0 z-[9999] flex items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="text-primary size-8 animate-spin" />
    </div>
  );
};
