import { createTheme } from '@mui/material/styles';

import designTokens from './designTokens';

export const MUITheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.colors.primary,
      light: designTokens.colors.primaryLight,
      dark: designTokens.colors.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: designTokens.colors.secondary,
      light: designTokens.colors.secondaryLight,
      dark: designTokens.colors.secondaryDark,
      contrastText: '#ffffff',
    },
    background: {
      default: designTokens.colors.background,
      paper: designTokens.colors.surface,
    },
    text: {
      primary: designTokens.colors.textPrimary,
      secondary: designTokens.colors.textSecondary,
    },
    divider: designTokens.colors.divider,
    error: {
      main: designTokens.colors.error,
    },
    success: {
      main: designTokens.colors.success,
    },
    warning: {
      main: designTokens.colors.warning,
    },
    info: {
      main: designTokens.colors.accent,
    },
  },
  spacing: designTokens.spacing.base,
});
