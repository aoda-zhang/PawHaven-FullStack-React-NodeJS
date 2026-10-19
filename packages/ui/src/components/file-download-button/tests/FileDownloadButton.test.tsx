// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileDownloadButton } from '../FileDownloadButton';

describe('FileDownloadButton', () => {
  it('renders its label', () => {
    render(<FileDownloadButton fileFetchRequest={vi.fn()} fileType="pdf" label="Download PDF" />);
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });
  it('supports disabled state', () => {
    render(<FileDownloadButton fileFetchRequest={vi.fn()} fileType="pdf" label="Download PDF" disabled />);
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeDisabled();
  });
});
