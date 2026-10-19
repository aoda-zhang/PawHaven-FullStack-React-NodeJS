// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Phase } from '../Phase';

describe('Phase', () => {
  it('renders the title and label/value rows', () => {
    render(<Phase title="Rescue details" sections={[{ label: 'Status', value: 'In progress' }, { label: 'Animal', value: 'Dog' }]} />);
    expect(screen.getByText('Rescue details')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Dog')).toBeInTheDocument();
  });
  it('renders sections without a title', () => {
    render(<Phase sections={[{ label: 'Status', value: 'Pending' }]} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
