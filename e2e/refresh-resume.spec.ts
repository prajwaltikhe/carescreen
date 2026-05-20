import { test, expect } from '@playwright/test';
import { answerScreensThrough, waitForForm } from './helpers';

test('mid-flow refresh restores session on screen 7', async ({ page }) => {
  await waitForForm(page);
  await answerScreensThrough(page, 6);

  await expect(page.getByTestId('form-wizard')).toHaveAttribute('data-screen-id', '7');

  await page.reload();
  await expect(page.getByTestId('loading')).toBeHidden({ timeout: 15000 });
  await expect(page.getByTestId('form-wizard')).toHaveAttribute('data-screen-id', '7');
  await expect(page.getByTestId('screen-prompt')).toContainText('diabetes');
});
