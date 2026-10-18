// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FollowerCount } from '../components/FollowerCount';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-US' },
    }),
  };
});

const renderCount = (props: React.ComponentProps<typeof FollowerCount> = {}) =>
  render(<FollowerCount {...props} />);

describe('FollowerCount', () => {
  it('renders nothing until the count has loaded', () => {
    const { container } = renderCount({ isLoading: true });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no count was given', () => {
    const { container } = renderCount();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the follower count once it has loaded', () => {
    renderCount({ count: 7 });

    expect(screen.getByText('rescueDetail.followers_count')).toBeVisible();
  });
});
