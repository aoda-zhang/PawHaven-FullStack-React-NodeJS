import notoSansScFont from '../../../assets/fonts/noto-sans-sc-chinese-simplified-400-normal.woff2';

/**
 * Embeds a simplified-Chinese font (Noto Sans SC) as a base64 data URL so that
 * headless Chromium on Vercel — which ships without any CJK fonts — can render
 * Chinese glyphs. The `font-family` name matches the stack declared in
 * `engine/index.css`, so no further CSS changes are required.
 */
export const cjkFontFace = `
@font-face {
  font-family: 'Noto Sans SC';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(${notoSansScFont}) format('woff2');
}
`;
