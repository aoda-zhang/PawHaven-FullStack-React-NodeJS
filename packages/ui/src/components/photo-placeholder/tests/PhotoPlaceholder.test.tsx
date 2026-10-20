// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PhotoPlaceholder } from '../PhotoPlaceholder';

describe('PhotoPlaceholder', () => {
  it('marks the decorative placeholder hidden from assistive technology', () => {
    const { container } = render(<PhotoPlaceholder />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
  it('forwards custom layout classes', () => {
    const { container } = render(<PhotoPlaceholder className="custom-size" />);
    expect(container.firstElementChild).toHaveClass('custom-size');
  });
});
