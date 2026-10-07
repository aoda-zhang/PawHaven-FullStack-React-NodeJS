import { expect, test } from '@playwright/test';

// The substrate for browser verification: one spec that proves the portal boots and renders its
// shell. It asserts nothing about a backend, so it runs from a bare checkout with only the portal
// up — which is what `playwright.config.ts`'s `webServer` starts. Deeper journeys belong in their
// own spec files, added by the change that needs them.
test.describe('portal shell', () => {
  test('mounts the app root without an uncaught error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/');

    await expect(page.locator('#root')).not.toBeEmpty();
    expect(await page.title()).not.toBe('');
    expect(
      pageErrors,
      `uncaught exceptions while loading /:\n${pageErrors.join('\n')}`,
    ).toEqual([]);
  });
});
