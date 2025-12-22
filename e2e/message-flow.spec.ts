import { test, expect } from '@playwright/test';

test.describe('メッセージ送受信', () => {
  test.beforeEach(async ({ page }) => {
    // ルームを作成
    await page.goto('/');
    await page.getByRole('button', { name: 'ルームを作成する' }).click();
    await page.waitForURL(/\/room\/[A-HJ-NP-Z2-9]{6}/);
  });

  test('メッセージを送信すると一覧に表示される', async ({ page }) => {
    const testMessage = 'テストメッセージ ' + Date.now();

    // メッセージを入力して送信
    await page.locator('textarea[placeholder="テキストを入力..."]').fill(testMessage);
    await page.getByRole('button', { name: '送信する' }).click();

    // メッセージが一覧に表示される
    await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 10000 });
  });

  test('空のメッセージは送信できない', async ({ page }) => {
    // 送信ボタンが無効化されている
    await expect(page.getByRole('button', { name: '送信する' })).toBeDisabled();

    // 空白だけの入力も送信できない
    await page.locator('textarea[placeholder="テキストを入力..."]').fill('   ');
    await expect(page.getByRole('button', { name: '送信する' })).toBeDisabled();
  });

  test('文字数カウンターが表示される', async ({ page }) => {
    // 初期状態で0文字
    await expect(page.locator('text=0 / 10,000 文字')).toBeVisible();

    // 入力すると文字数が増える
    await page.locator('textarea[placeholder="テキストを入力..."]').fill('テスト');
    await expect(page.locator('text=3 / 10,000 文字')).toBeVisible();
  });

  test('Ctrl+Enterでメッセージを送信できる', async ({ page }) => {
    const testMessage = 'Ctrl+Enter送信テスト ' + Date.now();

    await page.locator('textarea[placeholder="テキストを入力..."]').fill(testMessage);
    await page.locator('textarea[placeholder="テキストを入力..."]').press('Control+Enter');

    await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('コピー機能', () => {
  test('ルームURLをコピーできる', async ({ page, context }) => {
    // クリップボードへのアクセスを許可
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await page.getByRole('button', { name: 'ルームを作成する' }).click();
    await page.waitForURL(/\/room\/[A-HJ-NP-Z2-9]{6}/);

    // コピーボタンをクリック（aria-labelを使用）
    const copyButton = page.locator('button[aria-label="コピー"]');
    await copyButton.click();

    // コピー成功の確認（aria-labelが「コピー完了」に変わる）
    await expect(page.locator('button[aria-label="コピー完了"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('リアルタイム通信 (SSE)', () => {
  test('別のタブから送信したメッセージがリアルタイムで表示される', async ({ browser }) => {
    // 最初のタブでルームを作成
    const page1 = await browser.newPage();
    await page1.goto('/');
    await page1.getByRole('button', { name: 'ルームを作成する' }).click();
    await page1.waitForURL(/\/room\/[A-HJ-NP-Z2-9]{6}/);

    // ルームコードを取得
    const roomCode = await page1.getByTestId('room-code').textContent();

    // 2つ目のタブで同じルームに参加
    const page2 = await browser.newPage();
    await page2.goto(`/room/${roomCode}`);
    await page2.waitForSelector('[data-testid="room-code"]');

    // SSE接続とページのロードを待つ
    await page2.waitForTimeout(3000);

    // page2からメッセージを送信
    const testMessage = 'リアルタイムテスト ' + Date.now();
    const textarea = page2.locator('textarea[placeholder="テキストを入力..."]');
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(testMessage);

    // 送信ボタンが有効になるまで待つ
    const submitButton = page2.getByRole('button', { name: '送信する' });
    await submitButton.waitFor({ state: 'visible' });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // page1でメッセージがリアルタイムで表示される（SSE経由）
    await expect(page1.locator(`text=${testMessage}`)).toBeVisible({ timeout: 15000 });

    await page1.close();
    await page2.close();
  });
});
