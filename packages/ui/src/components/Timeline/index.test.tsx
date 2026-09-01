// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from './index';

describe('Timeline', () => {
  it('renders an ordered list container with list-item children', () => {
    const { container } = render(
      <Timeline>
        <TimelineItem>item</TimelineItem>
      </Timeline>,
    );

    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(screen.getByText('item').tagName).toBe('LI');
  });

  it('renders the dot as a decorative, aria-hidden element', () => {
    const { container } = render(<TimelineDot />);

    const dot = container.querySelector('span');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the primary variant classes', () => {
    const { container } = render(<TimelineDot variant="primary" />);

    expect(container.querySelector('span')).toHaveClass(
      'bg-primary',
      'text-primary-fg',
    );
  });

  it('renders the connector line', () => {
    const { container } = render(<TimelineConnector />);

    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('renders its content children inside a div', () => {
    const { container } = render(<TimelineContent>body</TimelineContent>);

    expect(container.querySelector('div')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('composes a full entry from the compound parts', () => {
    const { container } = render(
      <Timeline>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>update</TimelineContent>
        </TimelineItem>
      </Timeline>,
    );

    expect(screen.getByText('update')).toBeInTheDocument();
    expect(container.querySelectorAll('li').length).toBe(1);
  });
});
