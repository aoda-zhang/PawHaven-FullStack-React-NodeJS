import { expect, test } from '@playwright/test';

import { routePaths } from '../apps/frontend/portal/src/router/routePaths';

/**
 * The full-stack journeys need the API stack (Mongo + gateway + core/auth
 * services). Run them only when it is available:
 *   E2E_FULL_STACK=true pnpm test:e2e
 * Without it the suite still covers the parts that need no backend.
 */
const FULL_STACK = process.env.E2E_FULL_STACK === 'true';
const NOT_FOUND_HEADING = /page not found/i;

test.describe('SMOKE — routing without a backend', () => {
  test('an unknown route renders the not-found page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    await expect(
      page.getByRole('heading', { name: NOT_FOUND_HEADING }),
    ).toBeVisible();
  });
});

test.describe('AUTH — sign in and sign out', () => {
  test.skip(!FULL_STACK, 'requires the api stack');

  test('a visitor can sign in and sign out again', async ({ page }) => {
    await page.goto(routePaths.login);

    await page.locator('input[type="email"]').fill('admin@pawhaven.work');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(new RegExp(`${routePaths.home}$`));

    await page
      .getByRole('button', { name: /sign in|account|profile/i })
      .click();
    await page.getByRole('button', { name: /sign out|logout/i }).click();

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('signing in with a wrong password keeps the visitor on the form', async ({
    page,
  }) => {
    await page.goto(routePaths.login);

    await page.locator('input[type="email"]').fill('admin@pawhaven.work');
    await page.locator('input[type="password"]').fill('wrong-password');
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(new RegExp(`${routePaths.login}$`));
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('ADOPTION — browse rescue cases', () => {
  test.skip(!FULL_STACK, 'requires the api stack');

  test('a visitor can open the rescue case list', async ({ page }) => {
    await page.goto(routePaths.rescueCases);

    await expect(
      page.getByRole('heading', { name: NOT_FOUND_HEADING }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /all|pending/i }),
    ).toBeVisible();
  });
});

test.describe('REPORT ANIMAL — submit a stray animal report', () => {
  test.skip(!FULL_STACK, 'requires the api stack and an authenticated session');

  test('an authenticated user reaches the report form', async ({ page }) => {
    await page.goto(routePaths.login);
    await page.locator('input[type="email"]').fill('admin@pawhaven.work');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();

    await page.goto(routePaths.reportAnimal);

    await expect(
      page.getByRole('heading', { name: NOT_FOUND_HEADING }),
    ).toHaveCount(0);
    await expect(page.locator('form')).toBeVisible();
  });
});
