import { useMatches } from 'react-router-dom';

/**
 * Gets the current route match information from React Router.
 * Returns the last (most specific) route match in the hierarchy.
 *
 * @returns The current route match object as type T, or undefined when there is no match
 */
export const useRouterInfo = <T>(): T | undefined => {
  const matches = useMatches();
  const current = matches.at(-1);
  return current as T | undefined;
};
