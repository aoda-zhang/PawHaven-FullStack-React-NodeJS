import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Login } from '../login';
import { Register } from '../register';

const messages = vi.hoisted(() => ({
  'validation.email.invalid': '请输入有效的电子邮箱地址。',
  'validation.password.invalid':
    '密码需为 6–8 位，包含大写字母、小写字母、数字，以及 -、_、+ 中的一个；只能使用字母、数字和 - _ +。',
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({
      t: (key: string) => messages[key as keyof typeof messages] ?? key,
      i18n: {
        exists: (key: string) => key in messages,
        resolvedLanguage: 'zh-CN',
      },
    }),
  };
});

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
  ScrollRestoration: () => null,
}));

vi.mock('@/app/providers/GlobalProvider', () => ({
  useGlobalContext: () => ({
    login: vi.fn(),
    register: vi.fn(),
    isPending: false,
  }),
}));

describe('Auth validation messages', () => {
  it('shows localized messages when empty login credentials are submitted', async () => {
    render(<Login />);

    fireEvent.click(screen.getByTestId('auth-submit-button'));

    expect(
      await screen.findByText(messages['validation.email.invalid']),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(messages['validation.password.invalid'], {
        selector: 'p',
      }),
    ).toHaveLength(1);
  });

  it('shows one complete password message when registering with a weak password', async () => {
    render(<Register />);

    fireEvent.change(screen.getByTestId('form-input-password'), {
      target: { value: 'weak' },
    });
    fireEvent.click(screen.getByTestId('auth-submit-button'));

    expect(
      await screen.findByText(messages['validation.password.invalid'], {
        selector: 'p',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(messages['validation.password.invalid'], {
        selector: 'p',
      }),
    ).toHaveLength(1);
    expect(
      screen.getByText(messages['validation.email.invalid']),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('validation.password.missing_uppercase'),
    ).not.toBeInTheDocument();
  });
});
