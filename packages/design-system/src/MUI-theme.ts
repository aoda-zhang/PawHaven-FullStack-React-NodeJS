import { createTheme, type ThemeOptions } from '@mui/material/styles';

import { color, easing, radius, shadow, typography } from './tokens';

const baseOptions: ThemeOptions = {
  cssVariables: true,
  palette: {
    primary: {
      main: color.primary,
      light: color.primaryLight,
      dark: color.primaryActive,
      contrastText: color.textInverse,
    },
    secondary: {
      main: color.secondary,
      light: color.secondaryLight,
      dark: 'var(--color-secondary-active)',
      contrastText: color.textInverse,
    },
    background: {
      default: color.background,
      paper: color.surface,
    },
    text: {
      primary: color.text,
      secondary: color.textSecondary,
    },
    divider: color.border,
    error: { main: color.error },
    success: { main: color.success },
    warning: { main: color.warning },
    info: { main: color.info },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 4,
  typography: {
    fontFamily: typography.fontSans,
    h1: { fontFamily: typography.fontHeading },
    h2: { fontFamily: typography.fontHeading },
    h3: { fontFamily: typography.fontHeading },
    h4: { fontFamily: typography.fontHeading },
    h5: { fontFamily: typography.fontHeading },
    h6: { fontFamily: typography.fontHeading },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 500,
    },
    easing: {
      easeInOut: easing.standard,
      easeOut: 'var(--ease-out)',
      easeIn: 'var(--ease-in)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.button,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius.card,
          boxShadow: shadow.card,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.input,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.dialog,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: radius.sm,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: color.textLink,
        },
      },
    },
  },
};

export const MUITheme = createTheme(baseOptions);

export function createMUITheme(overrides?: ThemeOptions) {
  return createTheme(
    overrides
      ? {
          ...baseOptions,
          ...overrides,
          components: { ...baseOptions.components, ...overrides.components },
        }
      : baseOptions,
  );
}
