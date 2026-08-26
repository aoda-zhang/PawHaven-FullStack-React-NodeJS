import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportAnimal } from '../index';

import { useCurrentUser } from '@/features/Auth/api/auth.queries';
import { routePaths } from '@/router/routePaths';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/features/Auth/api/auth.queries', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('../components/ReportWizard', () => ({
  ReportWizard: () => <div data-testid="report-wizard" />,
}));

const mockedUseCurrentUser = vi.mocked(useCurrentUser);

describe('ReportAnimal login gate', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('shows a loading hint while the current-user query is pending', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useCurrentUser>);

    render(<ReportAnimal />);

    expect(screen.getByText('reportAnimal.wizard.loading')).toBeInTheDocument();
  });

  it('shows the sign-in prompt and navigates to login when signed out', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    render(<ReportAnimal />);

    expect(
      screen.getByText('reportAnimal.wizard.sign_in_required_title'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('reportAnimal.wizard.sign_in_button'));

    expect(mockNavigate).toHaveBeenCalledWith(routePaths.login);
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
