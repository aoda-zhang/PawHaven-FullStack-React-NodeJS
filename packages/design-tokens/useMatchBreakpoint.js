// A responsive hook that checks whether the current viewport width meets a given breakpoint.
// Accepts either a breakpoint name (e.g. "md") or a numeric pixel value.
import { useState, useEffect, useCallback } from 'react';

import BREAKPOINTS from './breakpoints';

export const useMatchBreakpoint = (input) => {
  const getTarget = useCallback(() => {
    return typeof input === 'number' ? input : BREAKPOINTS[input];
  }, [input]);
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return getTarget() >= window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      setMatches(getTarget() >= window.innerWidth);
    };
    window.addEventListener('resize', check);
    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('resize', check);
  }, [getTarget, input]);
  return matches;
};
