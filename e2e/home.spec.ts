import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('タイトルとサブタイトルが表示される', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Setsuna');
    await expect(page.locator('text=デバイス間でテキストを共有')).toBeVisible();
  });

  test('ルーム作成カードが表示される', async ({ page }) => {
    await expect(page.locator('text=新しいルームを作成')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ルームを作成する' })).toBeVisible();
  });

  test('ルーム参加カードが表示される', async ({ page }) => {
    await expect(page.locator('text=ルームに参加')).toBeVisible();
    await expect(page.getByRole('button', { name: '参加する' })).toBeVisible();
  });
});
