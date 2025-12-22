import { test, expect } from '@playwright/test';

test.describe('ルーム作成フロー', () => {
  test('ルームを作成するとルームページに遷移する', async ({ page }) => {
    await page.goto('/');

    // ルーム作成ボタンをクリック
    await page.getByRole('button', { name: 'ルームを作成する' }).click();

    // ルームページへの遷移を待つ
    await page.waitForURL(/\/room\/[A-HJ-NP-Z2-9]{6}/);

    // ルームコードが表示されている
    const roomCode = page.getByTestId('room-code');
    await expect(roomCode).toBeVisible();

    // ルームコードが6文字の有効な形式
    const codeText = await roomCode.textContent();
    expect(codeText).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  test('ルームページに残り時間が表示される', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'ルームを作成する' }).click();
    await page.waitForURL(/\/room\/[A-HJ-NP-Z2-9]{6}/);

    // 残り時間の表示を確認（24時間以内の形式）
    await expect(page.locator('text=残り:')).toBeVisible();
  });

  test('メッセージ入力欄が表示される', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'ルームを作成する' }).click();
    await page.waitForURL(/\/room\/[A-HJ-NP-Z2-9]{6}/);

    await expect(page.locator('textarea[placeholder="テキストを入力..."]')).toBeVisible();
    await expect(page.getByRole('button', { name: '送信する' })).toBeVisible();
  });
});

test.describe('ルーム参加フロー', () => {
  test('有効なコードでルームに参加できる', async ({ page }) => {
    // まずルームを作成
    await page.goto('/');
    await page.getByRole('button', { name: 'ルームを作成する' }).click();
    await page.waitForURL(/\/room\/[A-HJ-NP-Z2-9]{6}/);

    // ルームコードを取得
    const roomCode = await page.getByTestId('room-code').textContent();
    expect(roomCode).toBeTruthy();

    // ホームに戻ってコードで参加
    await page.goto('/');
    await page.locator('input[placeholder="A B C D 2 3"]').fill(roomCode!);
    await page.getByRole('button', { name: '参加する' }).click();

    // 同じルームページに遷移
    await page.waitForURL(`/room/${roomCode}`);
    await expect(page.getByTestId('room-code')).toHaveText(roomCode!);
  });

  test('存在しないコードでエラーが表示される', async ({ page }) => {
    await page.goto('/');

    // 存在しないルームコードを入力
    await page.locator('input[placeholder="A B C D 2 3"]').fill('ZZZZZ9');
    await page.getByRole('button', { name: '参加する' }).click();

    // RoomJoinerコンポーネント内でエラーメッセージが表示される
    await expect(page.locator('text=ルームが見つかりません')).toBeVisible({ timeout: 10000 });
  });
});
