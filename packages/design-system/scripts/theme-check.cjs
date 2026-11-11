#!/usr/bin/env node
// Semantic theme completeness and WCAG contrast contract.
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const root = resolve(__dirname, '..', '..', '..');
const themeSource = readFileSync(resolve(root, 'packages/design-system/src/theme.css'), 'utf8');
const paletteSource = readFileSync(resolve(root, 'packages/design-system/src/tokens/color.css'), 'utf8');
function declarations(source) {
  const values = new Map();
  for (const match of source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) values.set(match[1], match[2].trim());
  return values;
}
const baseBlock = themeSource.match(/@theme\s*\{([\s\S]*?)\n\}/);
const darkBlock = themeSource.match(/\[data-theme=['"]dark['"]\]\s*\{([\s\S]*?)\n\}/);
if (!baseBlock || !darkBlock) { console.error('theme-check: missing base @theme or dark theme mapping.'); process.exit(2); }
const palette = declarations(paletteSource), base = declarations(baseBlock[1]), dark = declarations(darkBlock[1]);
const colorTokens = [...base.keys()].filter((key) => key.startsWith('--color-'));
const missing = colorTokens.filter((key) => !dark.has(key));
if (missing.length) console.error('theme-check: dark theme is missing:', missing.join(', '));
function resolveColor(name, theme, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  const raw = theme.get(name) ?? palette.get(name);
  if (!raw) return null;
  const ref = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (ref) return resolveColor(ref[1], theme, seen);
  const match = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = hex.split('').map((v) => v + v).join('');
  return [0,2,4].map((i) => parseInt(hex.slice(i,i+2),16));
}
const lum = (rgb) => { const c=rgb.map((v)=>{const x=v/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}); return .2126*c[0]+.7152*c[1]+.0722*c[2]; };
const ratio = (a,b) => { const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
const pairs = [
 ['--color-text','--color-background',4.5],['--color-text','--color-card',4.5],
 ['--color-text-secondary','--color-background',4.5],['--color-text-tertiary','--color-background',4.5],['--color-text-link','--color-background',4.5],
 ['--color-primary-fg','--color-primary',4.5],['--color-primary-fg','--color-primary-hover',4.5],['--color-primary-fg','--color-primary-active',4.5],['--color-accent-foreground','--color-accent',4.5],
 ['--color-error','--color-background',4.5],['--color-success','--color-background',4.5],
 ['--color-warning','--color-background',4.5],['--color-info','--color-background',4.5],
 ['--color-focus-ring','--color-background',3],['--color-body-text','--color-hero-bg',4.5],['--color-stat-labels','--color-hero-bg',4.5],['--color-footer-text','--color-footer-bg',4.5],['--color-footer-copy','--color-footer-bg',4.5],['--color-footer-muted','--color-footer-bg',4.5],
];
let failures=0;
for(const [mode,theme] of [['light',base],['dark',new Map([...base,...dark])]]) for(const [fg,bg,min] of pairs) {
 const f=resolveColor(fg,theme),b=resolveColor(bg,theme);
 if(!f||!b){console.error('theme-check:',mode,'cannot resolve',fg,'/',bg);failures++;continue;}
 const value=ratio(f,b);if(value<min){console.error('theme-check:',mode,fg,'on',bg,value.toFixed(2)+':1; needs '+min+':1');failures++;}
}
if(missing.length||failures)process.exit(1);
console.log('theme-check:',colorTokens.length,'semantic color tokens mapped in light/dark themes; contrast pairs pass.');
