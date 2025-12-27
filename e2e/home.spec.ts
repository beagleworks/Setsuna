import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('displays title and subtitle', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SETSUNA');
    await expect(page.locator('text=[REAL-TIME TEXT SHARING]')).toBeVisible();
  });

  test('displays room creator card', async ({ page }) => {
    await expect(page.locator('text=Create New Room')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Room' })).toBeVisible();
  });

  test('displays room joiner card', async ({ page }) => {
    await expect(page.locator('text=Join Existing Room')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join' })).toBeVisible();
  });

  test('displays language switcher', async ({ page }) => {
    await expect(page.locator('button:has-text("EN")')).toBeVisible();
    await expect(page.locator('button:has-text("JA")')).toBeVisible();
  });
});
