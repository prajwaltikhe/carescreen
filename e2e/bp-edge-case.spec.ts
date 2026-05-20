import { test, expect } from '@playwright/test';
import { answerScreensThrough, waitForForm } from './helpers';

test('hypertensive crisis + normal both checked shows warning and clinical review', async ({
  page,
}) => {
  await waitForForm(page);
  await answerScreensThrough(page, 7);

  // Screen 9 — Blood Pressure (skipped 8 since diabetes = no)
  await page.getByTestId('option-bloodPressure-normal').click();
  await page.getByTestId('option-bloodPressure-crisis').click();
  await expect(page.getByTestId('bp-contradiction-warning')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('next-button').click();

  // Screen 10: Medications (skip)
  await page.getByTestId('next-button').click();

  // Screen 11: Smoking
  await page.getByTestId('option-smoking-no').click();
  await page.getByTestId('next-button').click();

  // Screen 12: Alcohol
  await page.getByTestId('option-alcohol-never').click();
  await page.getByTestId('next-button').click();

  // Screen 13: Activity
  await page.getByTestId('option-activity-moderate').click();
  await page.getByTestId('next-button').click();

  // Screen 14: Diet (skip)
  await page.getByTestId('next-button').click();

  // Screen 15: Evaluation
  await page.getByTestId('next-button').click();

  await expect(page.getByTestId('result-screen')).toHaveAttribute(
    'data-code',
    'hypertensive_crisis',
  );
});
