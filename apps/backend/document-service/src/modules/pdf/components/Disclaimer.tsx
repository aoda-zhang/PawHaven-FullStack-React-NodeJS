import type { ReactElement } from 'react';

export interface DisclaimerProps {
  text: string;
}

export const Disclaimer = ({ text }: DisclaimerProps): ReactElement => (
  <footer className="border-border text-fineprint text-text-secondary mx-10 mt-1 border-t pt-3 text-center italic">
    {text}
  </footer>
);
