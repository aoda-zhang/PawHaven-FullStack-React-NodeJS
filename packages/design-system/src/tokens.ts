/* ============================================================
   Design Tokens — TypeScript access for JS/TS consumers
   ============================================================
   Single source of truth for programmatic token access.
   CSS custom properties remain the runtime source of truth;
   this module provides typed references for MUI, charts,
   canvas, inline styles, and any JS-driven styling.
   ============================================================ */

/* ── Color Primitives ─────────────────────────────────────── */

export const colorPrimitives = {
  gray: {
    1: '#ffffff',
    2: '#f8f8f8',
    3: '#f0f0f0',
    4: '#e5e5e5',
    5: '#d4d4d4',
    6: '#a3a3a3',
    7: '#737373',
    8: '#525252',
    9: '#2f2f2f',
    10: '#171717',
  },
  orange: {
    1: '#fff7ed',
    2: '#ffedd5',
    3: '#fed7aa',
    4: '#fdb87a',
    5: '#fb923c',
    6: '#f7823a',
    7: '#f66b26',
    8: '#e65a1a',
    9: '#c2410b',
    10: '#7a2b08',
  },
  green: {
    1: '#f0fdf4',
    2: '#dcfce7',
    3: '#bbf7d0',
    4: '#86efac',
    5: '#4ade80',
    6: '#4caf50',
    7: '#16a34a',
    8: '#15803d',
    9: '#166534',
    10: '#14532d',
  },
  red: {
    1: '#fff1f2',
    2: '#fee2e2',
    3: '#fecaca',
    4: '#fca5a5',
    5: '#f87171',
    6: '#ef4444',
    7: '#dc2626',
    8: '#b91c1c',
    9: '#991b1b',
    10: '#7f1d1d',
  },
  yellow: {
    1: '#fffbeb',
    2: '#fef3c7',
    3: '#fde68a',
    4: '#fcd34d',
    5: '#fbbf24',
    6: '#f59e0b',
    7: '#d97706',
    8: '#b45309',
    9: '#92400e',
    10: '#78350f',
  },
  blue: {
    1: '#eff6ff',
    2: '#dbeafe',
    3: '#bfdbfe',
    4: '#93c5fd',
    5: '#60a5fa',
    6: '#3b82f6',
    7: '#2563eb',
    8: '#1d4ed8',
    9: '#1e40af',
    10: '#1e3a8a',
  },
  brown: {
    1: '#fffaf6',
    2: '#fff5ec',
    3: '#f6e9df',
    4: '#ecdccf',
    5: '#e1cfbf',
    6: '#d3c3b3',
    7: '#b9a596',
    8: '#8f7b69',
    9: '#6b5642',
    10: '#4a392c',
  },
} as const;

/* ── Semantic CSS Variable References ─────────────────────── */

export const color = {
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  primaryActive: 'var(--color-primary-active)',
  primaryLight: 'var(--color-primary-light)',
  primarySubtle: 'var(--color-primary-subtle)',
  primaryFg: 'var(--color-primary-fg)',
  secondary: 'var(--color-secondary)',
  secondaryHover: 'var(--color-secondary-hover)',
  secondaryLight: 'var(--color-secondary-light)',
  surface: 'var(--color-surface)',
  background: 'var(--color-background)',
  backgroundSubtle: 'var(--color-background-subtle)',
  foreground: 'var(--color-foreground)',
  card: 'var(--color-card)',
  accent: 'var(--color-accent)',
  muted: 'var(--color-muted)',
  mutedStrong: 'var(--color-muted-strong)',
  heroBg: 'var(--color-hero-bg)',
  navBg: 'var(--color-nav-bg)',
  darkText: 'var(--color-dark-text)',
  bodyText: 'var(--color-body-text)',
  statLabels: 'var(--color-stat-labels)',
  divider: 'var(--color-divider)',
  footerText: 'var(--color-footer-text)',
  footerMuted: 'var(--color-footer-muted)',
  text: 'var(--color-text)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  textMuted: 'var(--color-text-muted)',
  textPlaceholder: 'var(--color-text-placeholder)',
  textInverse: 'var(--color-text-inverse)',
  textLink: 'var(--color-text-link)',
  border: 'var(--color-border)',
  borderHover: 'var(--color-border-hover)',
  borderStrong: 'var(--color-border-strong)',
  borderFocus: 'var(--color-border-focus)',
  borderError: 'var(--color-border-error)',
  error: 'var(--color-error)',
  errorLight: 'var(--color-error-light)',
  success: 'var(--color-success)',
  successLight: 'var(--color-success-light)',
  warning: 'var(--color-warning)',
  warningLight: 'var(--color-warning-light)',
  info: 'var(--color-info)',
  infoLight: 'var(--color-info-light)',
  rescuePending: 'var(--color-rescue-status-pending)',
  rescueInProgress: 'var(--color-rescue-status-inProgress)',
  rescueTreated: 'var(--color-rescue-status-treated)',
  rescueRecovering: 'var(--color-rescue-status-recovering)',
  rescueAwaitingAdoption: 'var(--color-rescue-status-awaitingAdoption)',
  rescueAdopted: 'var(--color-rescue-status-adopted)',
  rescueFailed: 'var(--color-rescue-status-failed)',
} as const;

export const spacing = {
  gutter: 'var(--spacing-gutter)',
  section: 'var(--spacing-section)',
  card: 'var(--spacing-card)',
  input: 'var(--spacing-input)',
} as const;

export const radius = {
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  xl2: 'var(--radius-2xl)',
  xl3: 'var(--radius-3xl)',
  full: 'var(--radius-full)',
  input: 'var(--radius-input)',
  button: 'var(--radius-button)',
  card: 'var(--radius-card)',
  dialog: 'var(--radius-dialog)',
} as const;

export const shadow = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  inner: 'var(--shadow-inner)',
  none: 'var(--shadow-none)',
  card: 'var(--shadow-card)',
  dropdown: 'var(--shadow-dropdown)',
  modal: 'var(--shadow-modal)',
  toast: 'var(--shadow-toast)',
} as const;

export const duration = {
  instant: 'var(--duration-75)',
  fast: 'var(--duration-100)',
  quick: 'var(--duration-150)',
  base: 'var(--duration-200)',
  normal: 'var(--duration-300)',
  slow: 'var(--duration-500)',
  slower: 'var(--duration-700)',
  slowest: 'var(--duration-1000)',
} as const;

export const easing = {
  standard: 'var(--ease-standard)',
  in: 'var(--ease-in)',
  out: 'var(--ease-out)',
  inOut: 'var(--ease-in-out)',
  decelerate: 'var(--ease-decelerate)',
  accelerate: 'var(--ease-accelerate)',
  bounce: 'var(--ease-bounce)',
} as const;

export const typography = {
  fontSans: 'var(--font-sans)',
  fontHeading: 'var(--font-heading)',
  fontSerif: 'var(--font-serif)',
  fontHandwriting: 'var(--font-handwriting)',
  fontSizeXs: 'var(--font-size-xs)',
  fontSizeSm: 'var(--font-size-sm)',
  fontSizeBase: 'var(--font-size-base)',
  fontSizeLg: 'var(--font-size-lg)',
  fontSizeXl: 'var(--font-size-xl)',
  fontSize2xl: 'var(--font-size-2xl)',
  fontSize3xl: 'var(--font-size-3xl)',
  fontSize4xl: 'var(--font-size-4xl)',
  fontSize5xl: 'var(--font-size-5xl)',
  fontSize6xl: 'var(--font-size-6xl)',
} as const;

export const text = {
  display: 'var(--text-display)',
  stat: 'var(--text-stat)',
  body: 'var(--text-body)',
  caption: 'var(--text-caption)',
} as const;

/* ── Type-safe CSS var helper ──────────────────────────────── */

/**
 * Build a CSS var() reference from a dotted path.
 * @example tokenVar('color.primary') → 'var(--color-primary)'
 */
export function tokenVar(path: string): string {
  const name = `--${path
    .replace(/\./g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()}`;
  return `var(${name})`;
}

/* ── Types ─────────────────────────────────────────────────── */

export type ColorPrimitive = keyof typeof colorPrimitives;
export type ColorToken = keyof typeof color;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ShadowToken = keyof typeof shadow;
export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
export type TypographyToken = keyof typeof typography;
export type TextToken = keyof typeof text;
