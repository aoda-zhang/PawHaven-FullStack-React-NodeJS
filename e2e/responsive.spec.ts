import { expect, test } from '@playwright/test';

// Mobile-only coverage: the desktop specs in this folder assume a pointer-driven
// layout, so the mobile project runs this spec exclusively.
test.describe('mobile layout', () => {
  test('renders the portal shell without horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('#root')).not.toBeEmpty();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
