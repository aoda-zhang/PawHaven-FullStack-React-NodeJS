import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Login } from '../login';

const messages = vi.hoisted(() => ({
  'validation.email.invalid': '请输入有效的电子邮箱地址。',
  'validation.password.too_short': '密码至少需要 6 个字符。',
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
  it('shows localized messages when empty credentials are submitted', async () => {
    render(<Login />);

    fireEvent.click(screen.getByTestId('auth-submit-button'));

    expect(
      await screen.findByText(messages['validation.email.invalid']),
    ).toBeInTheDocument();
    expect(screen.getByText('密码至少需要 6 个字符。')).toBeInTheDocument();
  });
});
