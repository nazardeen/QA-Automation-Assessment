import { test, expect } from '@playwright/test';

test('should search for an equity and verify results', async ({ page }) => {
  await page.goto('https://www.medirect.com.mt/invest/equities/search');

  const searchBox = page.locator("input[placeholder='Enter name, ISIN, or ticker']");
  await expect(searchBox).toBeVisible();


  await searchBox.fill('Apple');


  await page.waitForTimeout(2000); 


  const results = page.locator('table tr');
  const rowCount = await results.count(); 
  expect(rowCount).toBeGreaterThan(1); 
});
