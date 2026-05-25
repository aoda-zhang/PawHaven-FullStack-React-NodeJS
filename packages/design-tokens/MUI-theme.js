import { createTheme } from '@mui/material/styles';

import { theme } from './designTokens';

export const MUITheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: theme.colors.primary,
      light: theme.colors.primaryLight,
      dark: theme.colors.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: theme.colors.secondary,
      light: theme.colors.secondaryLight,
      dark: theme.colors.secondaryDark,
      contrastText: '#ffffff',
    },
    background: {
      default: theme.colors.background,
      paper: theme.colors.surface,
    },
    text: {
      primary: theme.colors.textPrimary,
      secondary: theme.colors.textSecondary,
    },
    divider: theme.colors.divider,
    error: {
      main: theme.colors.error,
    },
    success: {
      main: theme.colors.success,
    },
    warning: {
      main: theme.colors.warning,
    },
    info: {
      main: theme.colors.accent,
    },
  },
  spacing: theme.spacing.base,
});
