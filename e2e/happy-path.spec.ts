import { test, expect } from '@playwright/test';
import { completeEligibleFlow, waitForForm } from './helpers';

test('happy path: screens 1–15 with Eligible result', async ({ page }) => {
  await waitForForm(page);
  await completeEligibleFlow(page);

  await expect(page.getByTestId('result-screen')).toBeVisible();
  await expect(page.getByTestId('result-screen')).toHaveAttribute('data-status', 'eligible');
  await expect(page.getByTestId('result-title')).toHaveText('Eligible');
});
