import { test, expect } from '@playwright/test';

test.describe('Message sending and receiving', () => {
  test.beforeEach(async ({ page }) => {
    // Create a room
    await page.goto('/en');
    await page.getByRole('button', { name: 'Create Room' }).click();
    await page.waitForURL(/\/en\/room\/[A-HJ-NP-Z2-9]{6}/);
  });

  test('sent message appears in the list', async ({ page }) => {
    const testMessage = 'Test message ' + Date.now();

    // Enter and send message
    await page.locator('textarea[placeholder="Enter text..."]').fill(testMessage);
    await page.getByRole('button', { name: 'Send' }).click();

    // Message appears in the list
    await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 10000 });
  });

  test('cannot send empty message', async ({ page }) => {
    // Send button is disabled
    await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled();

    // Whitespace-only input also cannot be sent
    await page.locator('textarea[placeholder="Enter text..."]').fill('   ');
    await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  test('character counter is displayed', async ({ page }) => {
    // Initial state shows 0 characters
    await expect(page.locator('text=0 / 10,000 characters')).toBeVisible();

    // Input increases character count
    await page.locator('textarea[placeholder="Enter text..."]').fill('test');
    await expect(page.locator('text=4 / 10,000 characters')).toBeVisible();
  });

  test('can send message with Ctrl+Enter', async ({ page }) => {
    const testMessage = 'Ctrl+Enter send test ' + Date.now();

    await page.locator('textarea[placeholder="Enter text..."]').fill(testMessage);
    await page.locator('textarea[placeholder="Enter text..."]').press('Control+Enter');

    await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Copy functionality', () => {
  test('can copy room URL', async ({ page, context }) => {
    // Grant clipboard access
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/en');
    await page.getByRole('button', { name: 'Create Room' }).click();
    await page.waitForURL(/\/en\/room\/[A-HJ-NP-Z2-9]{6}/);

    // Click copy button (using aria-label)
    const copyButton = page.locator('button[aria-label="Copy"]');
    await copyButton.click();

    // Confirm copy success (aria-label changes to "Copied")
    await expect(page.locator('button[aria-label="Copied"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Real-time communication (SSE)', () => {
  test('message sent from another tab appears in real-time', async ({ browser }) => {
    // Create room in first tab
    const page1 = await browser.newPage();
    await page1.goto('/en');
    await page1.getByRole('button', { name: 'Create Room' }).click();
    await page1.waitForURL(/\/en\/room\/[A-HJ-NP-Z2-9]{6}/);

    // Get room code
    const roomCode = await page1.getByTestId('room-code').textContent();

    // Join same room in second tab
    const page2 = await browser.newPage();
    await page2.goto(`/en/room/${roomCode}`);
    await page2.waitForSelector('[data-testid="room-code"]');

    // Wait for SSE connection and page load
    await page2.waitForTimeout(3000);

    // Send message from page2
    const testMessage = 'Real-time test ' + Date.now();
    const textarea = page2.locator('textarea[placeholder="Enter text..."]');
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(testMessage);

    // Wait for send button to be enabled
    const submitButton = page2.getByRole('button', { name: 'Send' });
    await submitButton.waitFor({ state: 'visible' });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Message appears in real-time on page1 (via SSE)
    await expect(page1.locator(`text=${testMessage}`)).toBeVisible({ timeout: 15000 });

    await page1.close();
    await page2.close();
  });
});
