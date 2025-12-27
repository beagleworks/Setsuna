import { test, expect } from '@playwright/test';

test.describe('Room creation flow', () => {
  test('creating a room navigates to room page', async ({ page }) => {
    await page.goto('/en');

    // Click create room button
    await page.getByRole('button', { name: 'Create Room' }).click();

    // Wait for navigation to room page (with locale prefix)
    await page.waitForURL(/\/en\/room\/[A-HJ-NP-Z2-9]{6}/);

    // Room code is displayed
    const roomCode = page.getByTestId('room-code');
    await expect(roomCode).toBeVisible();

    // Room code is 6 characters in valid format
    const codeText = await roomCode.textContent();
    expect(codeText).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  test('room page displays remaining time', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('button', { name: 'Create Room' }).click();
    await page.waitForURL(/\/en\/room\/[A-HJ-NP-Z2-9]{6}/);

    // Check remaining time display (within 24 hours format)
    await expect(page.locator('text=Remaining:')).toBeVisible();
  });

  test('message input field is displayed', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('button', { name: 'Create Room' }).click();
    await page.waitForURL(/\/en\/room\/[A-HJ-NP-Z2-9]{6}/);

    await expect(page.locator('textarea[placeholder="Enter text..."]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  });
});

test.describe('Room join flow', () => {
  test('can join room with valid code', async ({ page }) => {
    // First create a room
    await page.goto('/en');
    await page.getByRole('button', { name: 'Create Room' }).click();
    await page.waitForURL(/\/en\/room\/[A-HJ-NP-Z2-9]{6}/);

    // Get room code
    const roomCode = await page.getByTestId('room-code').textContent();
    expect(roomCode).toBeTruthy();

    // Go back home and join with code
    await page.goto('/en');
    await page.locator('input[placeholder="A B C D 2 3"]').fill(roomCode!);
    await page.getByRole('button', { name: 'Join' }).click();

    // Navigate to same room page
    await page.waitForURL(`/en/room/${roomCode}`);
    await expect(page.getByTestId('room-code')).toHaveText(roomCode!);
  });

  test('shows error for non-existent code', async ({ page }) => {
    await page.goto('/en');

    // Enter non-existent room code
    await page.locator('input[placeholder="A B C D 2 3"]').fill('ZZZZZ9');
    await page.getByRole('button', { name: 'Join' }).click();

    // Error message is displayed in RoomJoiner component
    await expect(page.locator('text=Room not found')).toBeVisible({ timeout: 10000 });
  });
});
