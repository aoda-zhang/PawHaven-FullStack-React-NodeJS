import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { expect, test, type Page } from '@playwright/test';

import { routePaths } from '../apps/frontend/portal/src/app/router/routePaths';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

/**
 * Every route the portal serves. `rescueCaseDetail` is excluded: it needs a real animal id and a
 * mocked API response to render anything but a skeleton, so it is covered by the report-animal
 * journey instead.
 */
const ROUTES = [
  { name: 'home', path: routePaths.home },
  { name: 'rescue cases', path: routePaths.rescueCases },
  { name: 'rescue guides', path: routePaths.rescueGuides },
  { name: 'login', path: routePaths.login },
  { name: 'register', path: routePaths.register },
  { name: 'report animal', path: routePaths.reportAnimal },
];

/**
 * Every rule runs here, including `color-contrast` — these pages render with their real
 * backgrounds, so a contrast failure is a real accessibility defect (unlike Storybook stories,
 * where the canvas background is not the page background).
 */
const AXE_OPTIONS = {
  resultTypes: ['violations'] as const,
};

const scan = async (page: Page) => {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async (options) => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            c: Document,
            o: unknown,
          ) => Promise<{
            violations: Array<{
              id: string;
              impact?: string | null;
              help: string;
              nodes: Array<{ target: string[] }>;
            }>;
          }>;
        };
      }
    ).axe;
    const results = await axe.run(document, options);
    return results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? 'unknown',
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(' ')),
    }));
  }, AXE_OPTIONS);
};

for (const route of ROUTES) {
  test(`accessible: ${route.name} (${route.path})`, async ({ page }) => {
    await page.goto(route.path);
    // Wait for the app shell to render before scanning; scanning an empty root hides every rule.
    await page.waitForFunction(
      () => (document.querySelector('#root')?.childElementCount ?? 0) > 0,
      undefined,
      { timeout: 15_000 },
    );

    const violations = await scan(page);
    const summary = violations
      .map(
        (violation) =>
          `${violation.id} [${violation.impact}] ${violation.help}\n    ${violation.targets.join('\n    ')}`,
      )
      .join('\n');

    expect(violations, `\n${summary}\n`).toEqual([]);
  });
}
