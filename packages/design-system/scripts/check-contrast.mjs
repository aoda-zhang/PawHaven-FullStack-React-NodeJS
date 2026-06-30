#!/usr/bin/env node

/**
 * Contrast check for design token pairings.
 * Asserts that key text/background token pairings meet WCAG AA (4.5:1).
 *
 * Usage: node scripts/check-contrast.mjs
 *
 * Tokens are resolved from tokens/color.css by parsing hex values.
 * In production, pair with Storybook's @storybook/addon-a11y for
 * component-level checks.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const colorCssPath = resolve(__dirname, '../tokens/color.css');

/* ── Parse CSS @theme block for --color-* declarations ────── */
function parseColorTokens(css) {
  const tokens = {};
  const themeMatch = css.match(/@theme\s*\{([^}]+)\}/s);
  if (!themeMatch) return tokens;

  const block = themeMatch[1];
  const regex = /--color-([\w-]+):\s*(#[0-9a-fA-F]{6}|rgba?\([^)]+\))/g;
  let match;
  while ((match = regex.exec(block)) !== null) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

/* ── WCAG relative luminance ───────────────────────────────── */
function relativeLuminance(hex) {
  if (hex.startsWith('rgba')) {
    // Extract R, G, B from rgba(r, g, b, a)
    const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return 0;
    return luminanceRGB(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return luminanceRGB(r, g, b);
}

function luminanceRGB(r, g, b) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ── Key pairings to check ─────────────────────────────────── */
const PAIRINGS = [
  { fg: 'gray-9', bg: 'brown-4', label: 'text / background' },
  { fg: 'gray-1', bg: 'orange-6', label: 'text-inverse / primary' },
  { fg: 'gray-7', bg: 'gray-1', label: 'text-secondary / surface' },
  { fg: 'red-6', bg: 'gray-1', label: 'error / surface' },
  { fg: 'gray-1', bg: 'green-6', label: 'text-inverse / secondary' },
];

const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;

/* ── Run checks ────────────────────────────────────────────── */
const css = readFileSync(colorCssPath, 'utf-8');
const tokens = parseColorTokens(css);

console.log('🔍 Checking WCAG contrast pairings…\n');

let failures = 0;

for (const { fg, bg, label } of PAIRINGS) {
  const fgHex = tokens[fg];
  const bgHex = tokens[bg];

  if (!fgHex || !bgHex) {
    console.log(`⚠️  SKIP: ${label} — token not found (fg=${fgHex}, bg=${bgHex})`);
    continue;
  }

  const ratio = contrastRatio(fgHex, bgHex);
  const pass = ratio >= WCAG_AA_NORMAL;
  const status = pass ? '✅' : '❌';

  console.log(
    `${status} ${label.padEnd(30)} ${ratio.toFixed(2)}:1  ${pass ? '' : `(needs ≥${WCAG_AA_NORMAL}:1)`}`,
  );

  if (!pass) failures++;
}

console.log(`\n${failures === 0 ? '✅ All pairings pass WCAG AA.' : `❌ ${failures} pairings fail WCAG AA.`}`);
process.exit(failures > 0 ? 1 : 0);
