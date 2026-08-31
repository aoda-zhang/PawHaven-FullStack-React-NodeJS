// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Carousel } from '../index';

const createMediaQueryList = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Embla needs matchMedia + IntersectionObserver + ResizeObserver on init;
// jsdom implements none of them. Browser-API polyfills, not component mocks.
beforeAll(() => {
  window.matchMedia = ((query: string) =>
    createMediaQueryList(query)) as typeof window.matchMedia;

  window.IntersectionObserver = function IntersectionObserverStub() {
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
      takeRecords: () => [],
    };
  } as unknown as typeof window.IntersectionObserver;

  window.ResizeObserver = function ResizeObserverStub() {
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    };
  } as unknown as typeof window.ResizeObserver;
});

const images = [
  { src: 'blob:first', alt: 'first photo' },
  { src: 'blob:second', alt: 'second photo' },
];

describe('Carousel', () => {
  it('renders every slide and stays mounted (no re-render loop)', () => {
    render(<Carousel images={images} />);

    expect(screen.getAllByRole('group')).toHaveLength(images.length);
    expect(screen.getByAltText('first photo')).toBeDefined();
    expect(screen.getByAltText('second photo')).toBeDefined();
    expect(screen.getByRole('region')).toBeDefined();
  });

  it('renders nav controls with the default labels', () => {
    render(<Carousel images={images} />);

    expect(screen.getByLabelText('Previous slide')).toBeDefined();
    expect(screen.getByLabelText('Next slide')).toBeDefined();
  });

  it('keeps the nav controls clickable (not disabled)', () => {
    render(<Carousel images={images} loop />);

    expect(screen.getByLabelText('Previous slide')).toBeEnabled();
    expect(screen.getByLabelText('Next slide')).toBeEnabled();
  });

  it('renders a single image without carousel semantics', () => {
    render(<Carousel images={[{ src: 'blob:only', alt: 'only photo' }]} />);

    expect(screen.getByAltText('only photo')).toBeDefined();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('renders nothing when there are no images', () => {
    const { container } = render(<Carousel images={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
