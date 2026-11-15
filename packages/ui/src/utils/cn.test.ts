import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('lets a caller height class override the control default', () => {
    expect(cn('h-control', 'h-11')).toBe('h-11');
  });

  it('lets a caller padding class override the control inset', () => {
    expect(cn('px-control-x', 'px-6')).toBe('px-6');
  });

  it('replaces both control dimensions when the caller sets one size', () => {
    expect(cn('h-control w-control', 'size-8')).toBe('size-8');
  });

  it('collapses control size steps to the last one', () => {
    expect(cn('h-control-sm', 'h-control')).toBe('h-control');
  });

  it('keeps control utilities when the caller adds an unrelated class', () => {
    expect(cn('h-control w-control', 'rounded-button')).toBe(
      'h-control w-control rounded-button',
    );
  });
});
