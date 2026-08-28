import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportAnimal } from '../index';

import { useCurrentUser } from '@/features/Auth/api/auth.queries';

const mockedUseCurrentUser = vi.mocked(useCurrentUser);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/features/Auth/api/auth.queries', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('../components/ReportWizard', () => ({
  ReportWizard: () => <div data-testid="report-wizard" />,
}));

describe('ReportAnimal', () => {
  beforeEach(() => {
    mockedUseCurrentUser.mockReset();
  });

  it('shows a loading hint while the current-user query is pending', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useCurrentUser>);

    render(<ReportAnimal />);

    expect(screen.getByText('reportAnimal.wizard.loading')).toBeInTheDocument();
  });

  it('renders the report wizard when signed out', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    render(<ReportAnimal />);

    expect(screen.getByTestId('report-wizard')).toBeInTheDocument();
  });

  it('renders the report wizard when a user is signed in', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: { id: 'user-1' },
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    render(<ReportAnimal />);

    expect(screen.getByTestId('report-wizard')).toBeInTheDocument();
  });
});
