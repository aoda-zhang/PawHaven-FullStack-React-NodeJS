import { useMatches } from 'react-router-dom';

/**
 * Gets the current route match information from React Router.
 * Returns the last (most specific) route match in the hierarchy.
 *
 * @returns The current route match object cast to type T
 */
export const useRouterInfo = <T>(): T => {
  const matches = useMatches();
  const current = matches.at(-1);
  return current as T;
};
