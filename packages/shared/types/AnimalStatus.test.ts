import { describe, expect, it } from 'vitest';

import {
  AnimalStatusValues,
  isPublicAnimalStatus,
  PublicAnimalStatusValues,
} from './AnimalStatus.js';

describe('AnimalStatusValues', () => {
  it('holds the nine documented lifecycle values', () => {
    expect(AnimalStatusValues).toEqual([
      'pendingReview',
      'needsHelp',
      'rejected',
      'rescueInProgress',
      'underTreatment',
      'recovering',
      'awaitingAdoption',
      'adopted',
      'deceased',
    ]);
  });
});

describe('isPublicAnimalStatus', () => {
  it.each(PublicAnimalStatusValues)('publishes %s', (status) => {
    expect(isPublicAnimalStatus(status)).toBe(true);
  });

  it.each(['pendingReview', 'rejected', 'deceased'])(
    'does not publish %s',
    (status) => {
      expect(isPublicAnimalStatus(status)).toBe(false);
    },
  );

  it.each(['pending', 'inProgress', 'treated', 'failed'])(
    'does not publish the retired %s value',
    (status) => {
      expect(isPublicAnimalStatus(status)).toBe(false);
    },
  );

  it('does not publish null', () => {
    expect(isPublicAnimalStatus(null)).toBe(false);
  });

  it('does not publish undefined', () => {
    expect(isPublicAnimalStatus(undefined)).toBe(false);
  });
});
