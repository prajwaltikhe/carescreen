import { expect, type Page } from '@playwright/test';

export async function waitForForm(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('loading')).toBeHidden({ timeout: 30000 });
  await expect(page.getByTestId('form-wizard')).toBeVisible();
}

export async function answerScreensThrough(page: Page, throughScreen: number) {
  for (let screen = 1; screen <= throughScreen; screen++) {
    await fillCurrentScreen(page, screen);
    await page.getByTestId('next-button').click();
    await expect(page.getByTestId('form-wizard')).toBeVisible({ timeout: 10000 });
  }
}

async function fillCurrentScreen(page: Page, screen: number) {
  switch (screen) {
    case 1:
      await page.getByTestId('input-age').fill('45');
      break;
    case 2:
      await page.getByTestId('input-weightKg').fill('90');
      break;
    case 3:
      await page.getByTestId('input-heightCm').fill('170');
      break;
    case 4:
      // BMI computed screen — no input needed
      break;
    case 5:
      await page.getByTestId('option-pregnant-no').click();
      break;
    case 6:
      // Comorbidities — optional, skip
      break;
    case 7:
      await page.getByTestId('option-diabetes-no').click();
      break;
    default:
      break;
  }
}

export async function completeEligibleFlow(page: Page) {
  // Screen 1: Age
  await page.getByTestId('input-age').fill('45');
  await page.getByTestId('next-button').click();

  // Screen 2: Weight
  await page.getByTestId('input-weightKg').fill('90');
  await page.getByTestId('next-button').click();

  // Screen 3: Height
  await page.getByTestId('input-heightCm').fill('170');
  await page.getByTestId('next-button').click();

  // Screen 4: BMI (computed, just click Next)
  await page.getByTestId('next-button').click();

  // Screen 5: Pregnancy
  await page.getByTestId('option-pregnant-no').click();
  await page.getByTestId('next-button').click();

  // Screen 6: Comorbidities (optional, skip)
  await page.getByTestId('next-button').click();

  // Screen 7: Diabetes
  await page.getByTestId('option-diabetes-no').click();
  await page.getByTestId('next-button').click();

  // Screen 9: Blood Pressure (skipped 8 since no diabetes)
  await page.getByTestId('option-bloodPressure-normal').click();
  await page.getByTestId('next-button').click();

  // Screen 10: Medications (optional, skip)
  await page.getByTestId('next-button').click();

  // Screen 11: Smoking
  await page.getByTestId('option-smoking-no').click();
  await page.getByTestId('next-button').click();

  // Screen 12: Alcohol
  await page.getByTestId('option-alcohol-monthly').click();
  await page.getByTestId('next-button').click();

  // Screen 13: Activity
  await page.getByTestId('option-activity-moderate').click();
  await page.getByTestId('next-button').click();

  // Screen 14: Diet (optional, skip)
  await page.getByTestId('next-button').click();

  // Screen 15: Evaluation (click See results)
  await page.getByTestId('next-button').click();
}
