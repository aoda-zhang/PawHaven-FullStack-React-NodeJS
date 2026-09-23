import type { ReactElement } from 'react';

export interface DisclaimerProps {
  text: string;
}

export const Disclaimer = ({ text }: DisclaimerProps): ReactElement => (
  <footer className="border-brown-3 text-fineprint text-gray-6 mx-10 mt-1 border-t pt-3 text-center italic">
    {text}
  </footer>
);
