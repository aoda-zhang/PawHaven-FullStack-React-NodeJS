import { reducerNames } from './reducerNames';
import { store } from './reduxStore';

import type { ProfileType } from '@/pages/auth/types';

/**
 * Reads the signed-in profile outside React.
 *
 * Route loaders, guards and other non-hook code need this; inside a component
 * use the `useGlobalState()` hook instead so the read stays reactive.
 */
export const getCurrentProfile = (): ProfileType | undefined =>
  store.getState()?.[reducerNames.global]?.profile;
