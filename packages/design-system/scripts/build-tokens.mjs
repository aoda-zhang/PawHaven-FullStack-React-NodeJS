#!/usr/bin/env node

/**
 * Build design tokens from W3C Design Tokens Format JSON.
 *
 * Reads:  figma/tokens.json (exported from Tokens Studio Figma plugin)
 * Writes: tokens/*.css (@theme blocks), src/tokens.ts (typed JS)
 *
 * Usage: node scripts/build-tokens.mjs
 *
 * Requires: style-dictionary (install as devDependency)
 *   pnpm add -D style-dictionary
 *
 * When no figma/tokens.json exists, this script is a no-op.
 * Tokens are authored directly in CSS/TS until Figma sync is set up.
 */

import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FIGMA_TOKENS = resolve(ROOT, 'figma', 'tokens.json');

const BANNER = `/* AUTO-GENERATED — edit figma/tokens.json, then run: pnpm tokens:build */\n\n`;

if (!existsSync(FIGMA_TOKENS)) {
  console.log('⚠️  No figma/tokens.json found. Skipping token generation.');
  console.log('   Export tokens from Tokens Studio Figma plugin to figma/tokens.json,');
  console.log('   then run: pnpm tokens:build');
  process.exit(0);
}

console.log('📦 Building tokens from figma/tokens.json…');

try {
  const tokens = JSON.parse(readFileSync(FIGMA_TOKENS, 'utf-8'));

  // For now, this is a scaffold. When style-dictionary is added as a dependency,
  // the full transformation pipeline will be wired here.
  //
  // import StyleDictionary from 'style-dictionary';
  // const sd = new StyleDictionary({
  //   source: ['figma/tokens.json'],
  //   platforms: {
  //     css: {
  //       transformGroup: 'css',
  //       buildPath: 'tokens/',
  //       files: [{ destination: '_generated-color.css', format: 'css/variables' }],
  //     },
  //     ts: {
  //       transformGroup: 'js',
  //       buildPath: 'src/',
  //       files: [{ destination: 'tokens.generated.ts', format: 'javascript/es6' }],
  //     },
  //   },
  // });
  // await sd.cleanAllPlatforms();
  // await sd.buildAllPlatforms();

  console.log(`   ✅ Loaded ${Object.keys(tokens).length} token groups from figma/tokens.json`);
  console.log('   Full generation pipeline will be active when style-dictionary is installed.');
  console.log('   Run: pnpm add -D style-dictionary');
} catch (err) {
  console.error('❌ Failed to parse figma/tokens.json:', err.message);
  process.exit(1);
}
