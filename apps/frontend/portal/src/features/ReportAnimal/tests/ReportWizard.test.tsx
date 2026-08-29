import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReportWizard } from '../components/ReportWizard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@pawhaven/frontend-core', () => ({
  cn: (...inputs: Array<string | false | null | undefined>) =>
    inputs.filter(Boolean).join(' '),
}));

vi.mock('@pawhaven/ui', () => ({
  isValidPhoneNumber: () => true,
  PhoneInput: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange?: (nextValue: string) => void;
  }) => (
    <input
      aria-label="phone"
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../api/reportAnimal.mutations', () => ({
  useCreateReportAnimal: () => ({ mutate: vi.fn(), isPending: false }),
}));

const enterAddress = () => {
  fireEvent.change(
    screen.getByPlaceholderText('reportAnimal.wizard.step1_landmark_hint'),
    { target: { value: 'Central Park' } },
  );
};

const clickContinue = () => {
  fireEvent.click(screen.getByText('reportAnimal.wizard.nav_continue'));
};

describe('ReportWizard — required field checks', () => {
  it('blocks Continue on the location step when the address is empty', () => {
    render(<ReportWizard />);

    clickContinue();

    expect(
      screen.getByText('reportAnimal.wizard.step1_address_required'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('reportAnimal.wizard.step1_title'),
    ).toBeInTheDocument();
  });

  it('advances to the animal step once an address is entered', () => {
    render(<ReportWizard />);

    enterAddress();
    clickContinue();

    expect(
      screen.getByText('reportAnimal.wizard.step2_title'),
    ).toBeInTheDocument();
  });

  it('blocks Continue when the other animal type has no description', () => {
    render(<ReportWizard />);

    enterAddress();
    clickContinue();
    fireEvent.click(screen.getByText('reportAnimal.other'));
    clickContinue();

    expect(
      screen.getByText('reportAnimal.wizard.step2_other_required'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('reportAnimal.wizard.step2_title'),
    ).toBeInTheDocument();
  });

  it('advances after the other animal type is described', () => {
    render(<ReportWizard />);

    enterAddress();
    clickContinue();
    fireEvent.click(screen.getByText('reportAnimal.other'));
    fireEvent.change(
      screen.getByPlaceholderText(
        'reportAnimal.wizard.step2_other_placeholder',
      ),
      { target: { value: 'Rabbit' } },
    );
    clickContinue();

    expect(
      screen.getByText('reportAnimal.wizard.step3_title'),
    ).toBeInTheDocument();
  });
});
