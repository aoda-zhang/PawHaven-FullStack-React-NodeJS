import { FALLBACK_ID_SUFFIX_LENGTH } from '../constants';

/**
 * Builds a display-only case id for reports the API accepted without
 * returning one. It reads the clock, so it lives outside the component
 * tree: react-hooks/purity rejects impure calls reached from component scope.
 */
export const createFallbackCaseId = (): string =>
  `REP-${Date.now().toString().slice(-FALLBACK_ID_SUFFIX_LENGTH)}`;
