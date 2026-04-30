import GlobalStyles from '@mui/material/GlobalStyles';
import {
  StyledEngineProvider,
  ThemeProvider,
  createTheme,
} from '@mui/material/styles';
import { MUITheme } from '@pawhaven/design-tokens/MUI-theme';

const theme = createTheme(MUITheme, {
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

export const MUIThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <StyledEngineProvider injectFirst>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
};
