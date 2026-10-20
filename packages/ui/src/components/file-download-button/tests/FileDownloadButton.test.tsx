// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FileDownloadButton } from '../FileDownloadButton';

const createObjectURL = vi.fn(() => 'blob:mock-object-url');
const revokeObjectURL = vi.fn();

const clickedAnchors: HTMLAnchorElement[] = [];

beforeEach(() => {
  clickedAnchors.length = 0;
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();

  Object.defineProperty(window.URL, 'createObjectURL', {
    value: createObjectURL,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    value: revokeObjectURL,
    writable: true,
    configurable: true,
  });

  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
    function mockAnchorClick(this: HTMLAnchorElement) {
      clickedAnchors.push(this);
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FileDownloadButton', () => {
  it('renders its children', () => {
    render(
      <FileDownloadButton fileFetchRequest={vi.fn()}>
        Download PDF
      </FileDownloadButton>,
    );

    expect(
      screen.getByRole('button', { name: 'Download PDF' }),
    ).toBeInTheDocument();
  });

  it('supports the disabled state', () => {
    render(
      <FileDownloadButton fileFetchRequest={vi.fn()} disabled>
        Download PDF
      </FileDownloadButton>,
    );

    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeDisabled();
  });

  it('downloads the blob and releases the object url', async () => {
    const blob = new Blob(['report'], { type: 'application/pdf' });
    const onSuccess = vi.fn();

    render(
      <FileDownloadButton
        fileFetchRequest={async () => blob}
        fileName="report.pdf"
        onSuccess={onSuccess}
      >
        Download
      </FileDownloadButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(blob));

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickedAnchors).toHaveLength(1);
    expect(clickedAnchors[0].download).toBe('report.pdf');
    expect(clickedAnchors[0].href).toContain('blob:mock-object-url');
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-object-url'),
    );
  });

  it('reports a failure through onError without writing to the console', async () => {
    const failure = new Error('network down');
    const onError = vi.fn();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <FileDownloadButton
        fileFetchRequest={async () => {
          throw failure;
        }}
        onError={onError}
      >
        Download
      </FileDownloadButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));

    expect(consoleError).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
