// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { getRequestQueryOptions } from '@pawhaven/frontend-core';
import { HTTP_STATUS } from '@pawhaven/shared';
import { showToast } from '@pawhaven/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportAnimal } from '../index';

const postMock = vi.hoisted(() => vi.fn());

vi.mock('@/shared/utils/apiClient', () => ({
  apiClient: { post: postMock },
}));

vi.mock('@pawhaven/ui', async () => {
  const actual = await vi.importActual('@pawhaven/ui');
  return {
    ...(actual as Record<string, unknown>),
    showToast: vi.fn(),
  };
});

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en' },
    }),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as Record<string, unknown>),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('lottie-react', () => ({ Lottie: () => null, default: () => null }));
vi.mock('lottie-web', () => ({ default: {} }));

const API_ERRORS = {
  badRequest: {
    type: 'BADREQUEST',
    status: HTTP_STATUS.BAD_REQUEST,
    code: 'REPORT_INVALID',
  },
  rateLimited: {
    type: 'RATELIMIT',
    status: HTTP_STATUS.TOO_MANY_REQUESTS,
    code: 'REPORT_RATE_LIMITED',
  },
  server: {
    type: 'SERVER',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: 'REPORT_UNAVAILABLE',
  },
} as const;

const scrollToMock = vi.fn();

const imageFile = (name: string) =>
  new File(['fake-image'], name, { type: 'image/jpeg' });

const renderPage = () => {
  const queryClient = new QueryClient(
    getRequestQueryOptions({
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      maxRetry: 0,
    }),
  );
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<ReportAnimal />, { wrapper: Wrapper });
};

type User = ReturnType<typeof userEvent.setup>;

const fillValidForm = async (user: User) => {
  await user.type(screen.getByTestId('form-input-address'), 'Central Park');
  await user.type(screen.getByTestId('form-input-coatColor'), 'black');
  await user.click(screen.getByLabelText('reportAnimal.size_small'));
  await user.click(screen.getByLabelText('reportAnimal.adult'));
  await user.click(screen.getByLabelText('reportAnimal.behavior_friendly'));
  await user.type(
    screen.getByRole('textbox', { name: 'reportAnimal.contact_label' }),
    '13800138000',
  );
  await user.type(
    screen.getByRole('textbox', { name: 'reportAnimal.description_label' }),
    'Found a stray cat',
  );

  const fileInput = document.querySelector('input[type="file"]');
  if (!fileInput) {
    throw new Error('photo input not found');
  }
  fireEvent.change(fileInput, {
    target: { files: [imageFile('a.jpg'), imageFile('b.jpg')] },
  });
};

const submitForm = async (user: User) => {
  await user.click(screen.getByRole('button', { name: 'reportAnimal.submit' }));
};

const fillAndSubmit = async (user: User) => {
  await fillValidForm(user);
  await submitForm(user);
};

beforeEach(() => {
  postMock.mockReset();
  vi.mocked(showToast).mockClear();
  scrollToMock.mockClear();
  window.scrollTo = scrollToMock;
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ReportAnimal submit feedback', () => {
  it('T1 leaves HTTP 400 feedback to the global toast and keeps the form editable', async () => {
    postMock.mockRejectedValueOnce(API_ERRORS.badRequest);
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.queryByText('reportAnimal.success_title'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('form-input-address')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'reportAnimal.submit' }),
    ).toBeInTheDocument();
  });

  it('T2 leaves HTTP 429 feedback to the global toast and keeps the form editable', async () => {
    postMock.mockRejectedValueOnce(API_ERRORS.rateLimited);
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('form-input-address')).toBeInTheDocument();
  });

  it('T3 leaves HTTP 500 feedback to the global toast and keeps the form visible', async () => {
    postMock.mockRejectedValueOnce(API_ERRORS.server);
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('form-input-address')).toBeInTheDocument();
  });

  it('T4 reports unreadable photos without calling the API', async () => {
    const readSpy = vi
      .spyOn(FileReader.prototype, 'readAsDataURL')
      .mockImplementation(() => {
        throw new Error('read failed');
      });
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('reportAnimal.photos_read_failed');
    expect(postMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('form-input-address')).toBeInTheDocument();

    readSpy.mockRestore();
  });

  it('T5 shows the real case id returned by the server', async () => {
    postMock.mockResolvedValueOnce({ id: 'stray-abc123' });
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(
      await screen.findByText('reportAnimal.success_title'),
    ).toBeInTheDocument();
    expect(screen.getByText(/stray-abc123/)).toBeInTheDocument();
    expect(screen.queryByText(/REP-/)).not.toBeInTheDocument();
    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
  });

  it('T6 refuses to show a success view when the response carries no id', async () => {
    postMock.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('reportAnimal.submit_failed');
    expect(
      screen.queryByText('reportAnimal.success_title'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/REP-/)).not.toBeInTheDocument();
    expect(screen.getByTestId('form-input-address')).toBeInTheDocument();
  });

  it('T7 clears the pending error on retry and shows the server id', async () => {
    postMock
      .mockRejectedValueOnce(API_ERRORS.badRequest)
      .mockResolvedValueOnce({ id: 'stray-xyz789' });
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);
    await waitFor(() => expect(showToast).toHaveBeenCalledTimes(1));

    await submitForm(user);

    expect(
      await screen.findByText('reportAnimal.success_title'),
    ).toBeInTheDocument();
    expect(screen.getByText(/stray-xyz789/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
