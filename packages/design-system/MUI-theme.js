import { createTheme } from '@mui/material/styles';

export const MUITheme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#f7823a',
      light: '#fdb87a',
      dark: '#e65a1a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4caf50',
      light: '#86efac',
      dark: '#2f8c3f',
      contrastText: '#ffffff',
    },
    background: {
      default: '#eee3d8',
      paper: '#ffffff',
    },
    text: {
      primary: '#2f2f2f',
      secondary: '#5c5c5c',
    },
    divider: '#f6e9df',
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#f59e0b',
    },
    info: {
      main: '#3b82f6',
    },
  },
  spacing: '0.25rem',
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
