import { expect, test } from '@playwright/test';

const REPORT_ANIMAL_PATH = '/report-animal';

test.describe('report animal', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          isSuccess: true,
          message: 'ok',
          code: '0',
          data: {
            userId: 'test-user-1',
            username: 'Test User',
            email: 'test@example.com',
            status: 'active',
          },
        }),
      }),
    );
  });

  test('shows the report form to an authenticated user', async ({ page }) => {
    await page.goto(REPORT_ANIMAL_PATH);

    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByText('Tell us about the animal')).toBeVisible();
    await expect(page.getByText('Behavior, urgency & contact')).toBeVisible();
  });

  test('redirects an unauthenticated user to login', async ({ page }) => {
    await page.unroute('**/api/auth/me');
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      }),
    );
    await page.goto(REPORT_ANIMAL_PATH);

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('shows validation errors for empty required fields', async ({
    page,
  }) => {
    await page.goto(REPORT_ANIMAL_PATH);

    await page.getByRole('button', { name: 'Submit Report' }).click();

    await expect(
      page.getByText('Please enter the address or landmark').first(),
    ).toBeVisible();
    await expect(
      page.getByText('Please enter the coat color').first(),
    ).toBeVisible();
    await expect(
      page.getByText('Please select the size').first(),
    ).toBeVisible();
    await expect(page.getByText('Please select the age').first()).toBeVisible();
  });

  test('submits a valid report and shows the success state', async ({
    page,
  }) => {
    await page.route('**/api/core/report-animal', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 201,
          isSuccess: true,
          message: 'ok',
          code: '0',
          data: { id: 'RPT-E2E-001' },
        }),
      }),
    );

    await page.goto(REPORT_ANIMAL_PATH);

    await page.getByTestId('form-input-coatColor').fill('orange');
    await page.getByTestId('form-input-coatColor').blur();

    await page.getByTestId('form-input-address').fill('Near the park entrance');
    await page.getByTestId('form-input-address').blur();

    await page
      .getByTestId('form-phone-contactPhone')
      .locator('input[type="tel"]')
      .fill('12345678');
    await page
      .getByTestId('form-phone-contactPhone')
      .locator('input[type="tel"]')
      .blur();

    await page
      .getByTestId('form-textarea-description')
      .fill('Found a friendly orange cat');
    await page.getByTestId('form-textarea-description').blur();

    await page.getByRole('radio', { name: /Small/i }).click();
    await page.getByRole('radio', { name: /Adult/i }).click();
    await page
      .getByRole('radio', { name: /Friendly — approaches people/i })
      .click();

    const photosInput = page.locator('input[type="file"]').first();
    await photosInput.setInputFiles([
      {
        name: 'photo1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data-1'),
      },
      {
        name: 'photo2.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data-2'),
      },
    ]);

    await page.getByRole('button', { name: 'Submit Report' }).click();

    await expect(page.getByText('Report submitted!')).toBeVisible({
      timeout: 10000,
    });
  });

  test('shows the other animal type input when animalType is other', async ({
    page,
  }) => {
    await page.goto(REPORT_ANIMAL_PATH);

    await page.getByRole('radio', { name: /Other/i }).click();

    await expect(page.getByTestId('form-input-otherAnimalType')).toBeVisible();
  });

  test('maps urgent checkbox to dangerous status', async ({ page }) => {
    await page.route('**/api/core/report-animal', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 201,
          isSuccess: true,
          message: 'ok',
          code: '0',
          data: { id: 'RPT-E2E-002' },
        }),
      }),
    );

    await page.goto(REPORT_ANIMAL_PATH);

    await page.getByTestId('form-input-coatColor').fill('black');
    await page.getByTestId('form-input-coatColor').blur();

    await page.getByTestId('form-input-address').fill('Central Park');
    await page.getByTestId('form-input-address').blur();

    await page
      .getByTestId('form-phone-contactPhone')
      .locator('input[type="tel"]')
      .fill('12345678');
    await page
      .getByTestId('form-phone-contactPhone')
      .locator('input[type="tel"]')
      .blur();

    await page.getByTestId('form-textarea-description').fill('Aggressive dog');
    await page.getByTestId('form-textarea-description').blur();

    await page.getByRole('radio', { name: /Large/i }).click();
    await page.getByRole('radio', { name: /Adult/i }).click();
    await page
      .getByRole('radio', { name: /Aggressive — growls or hisses/i })
      .click();

    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles([
        {
          name: 'photo1.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('img1'),
        },
        {
          name: 'photo2.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('img2'),
        },
      ]);

    await page.getByTestId('form-checkbox-urgent').click();

    await expect(
      page.getByText(
        'Reports marked as urgent are prioritized for volunteers.',
      ),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Submit Report' }).click();

    await expect(page.getByText('Report submitted!')).toBeVisible({
      timeout: 10000,
    });
  });
});
