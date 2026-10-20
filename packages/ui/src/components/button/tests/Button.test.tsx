// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../Button';

describe('Button', () => {
  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
  ])('prevents an asChild control from activating when %s', (_state, props) => {
    const onClick = vi.fn();

    render(
      <Button asChild {...props}>
        <a href="/adopt" onClick={onClick}>
          Continue
        </a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Continue' });
    expect(link).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(link);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('disables a native button while loading and exposes busy state', () => {
    render(<Button loading>Saving</Button>);

    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('renders the medium size and defaults to it', () => {
    const { rerender } = render(<Button size="md">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('h-10');

    rerender(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('h-10');
  });

  it('keeps a token backed focus indicator instead of suppressing the outline', () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).toHaveClass('focus-ring');
    expect(button.className).not.toContain('outline-none');
  });
});
