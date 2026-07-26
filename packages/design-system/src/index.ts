/* ============================================================
   Design System — JS/TS entry point
   ============================================================
   @pawhaven/design-system
   ============================================================ */

export {
  colorPrimitives,
  color,
  spacing,
  radius,
  shadow,
  duration,
  easing,
  typography,
  tokenVar,
} from './tokens';

export type {
  ColorPrimitive,
  ColorToken,
  SpacingToken,
  RadiusToken,
  ShadowToken,
  DurationToken,
  EasingToken,
  TypographyToken,
} from './tokens';

export { MUITheme, createMUITheme } from './MUI-theme';
