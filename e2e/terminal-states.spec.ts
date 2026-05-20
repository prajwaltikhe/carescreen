import { test, expect } from '@playwright/test';
import { waitForForm } from './helpers';

test('underage terminal on screen 1', async ({ page }) => {
  await waitForForm(page);
  await page.getByTestId('input-age').fill('16');
  await page.getByTestId('next-button').click();
  await expect(page.getByTestId('result-screen')).toHaveAttribute('data-code', 'underage');
});

test('pregnancy terminal on screen 5', async ({ page }) => {
  await waitForForm(page);
  await page.getByTestId('input-age').fill('30');
  await page.getByTestId('next-button').click();
  await page.getByTestId('input-weightKg').fill('90');
  await page.getByTestId('next-button').click();
  await page.getByTestId('input-heightCm').fill('170');
  await page.getByTestId('next-button').click();
  await page.getByTestId('next-button').click();
  await page.getByTestId('option-pregnant-yes').click();
  await page.getByTestId('next-button').click();
  await expect(page.getByTestId('result-screen')).toHaveAttribute('data-code', 'pregnancy');
});

test('already on GLP-1 routes to clinical review', async ({ page }) => {
  await waitForForm(page);
  await page.getByTestId('input-age').fill('40');
  await page.getByTestId('next-button').click();
  await page.getByTestId('input-weightKg').fill('90');
  await page.getByTestId('next-button').click();
  await page.getByTestId('input-heightCm').fill('170');
  await page.getByTestId('next-button').click();
  await page.getByTestId('next-button').click();
  await page.getByTestId('option-pregnant-no').click();
  await page.getByTestId('next-button').click();
  await page.getByTestId('next-button').click();
  await page.getByTestId('option-diabetes-no').click();
  await page.getByTestId('next-button').click();
  await page.getByTestId('next-button').click();
  await page.getByTestId('option-medications-glp1').click();
  await page.getByTestId('next-button').click();
  await expect(page.getByTestId('result-screen')).toHaveAttribute(
    'data-code',
    'already_on_glp1',
  );
});
