import { test, expect } from '@playwright/test';
import { EquitiesSearchPage } from '../pages/equities-search.page';

test.describe('Equities Search Tests', () => {
  let equitiesPage: EquitiesSearchPage;


  test.beforeEach(async ({ page }) => {
    equitiesPage = new EquitiesSearchPage(page);
    await equitiesPage.navigate();
    await equitiesPage.acceptCookiesIfVisible();
  });

  test('Verify equities list is displayed', async () => {
    await equitiesPage.waitForEquitiesTable();
    const rowCount = await equitiesPage.getRowCount();
    expect(rowCount).toBeGreaterThan(1);
  });

  test('Search for a popular equity and click on "More Information"', async () => {
    await equitiesPage.searchForStock('Apple');
    const rowCount = await equitiesPage.getRowCount();
    expect(rowCount).not.toBe(0);
    await equitiesPage.clickMoreInformationOnFirst();
  });

  test('Ensure security details remain locked for non-logged-in users', async () => {
    await equitiesPage.searchForStock('Apple');
    await equitiesPage.clickMoreInformationOnFirst();
    await expect(equitiesPage.lockIcon).toBeVisible();
  });

  test('Search for a non-existent equity and ensure the list is empty', async () => {
    console.log('Searching for a non-existent stock...');
    await equitiesPage.searchForStock('xyzxyzxyz');

    const rowCount = await equitiesPage.getRowCount();
    console.log(`Row count: ${rowCount}`);
    expect(rowCount).toBe(0);
    
    console.log('Test passed: No results displayed.');
  });




  test('Partial search returns expected item', async ({ page }) => {
    const equitiesPage = new EquitiesSearchPage(page);

    await equitiesPage.navigate();
    await equitiesPage.acceptCookiesIfVisible();

    await equitiesPage.searchForStock('Appl');

    const rowCount = await equitiesPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    const rowTexts = await equitiesPage.getRowTexts();
    const containsApple = rowTexts.some((row) => row.includes('Apple'));
    expect(containsApple).toBe(true);
  });

test('Pagination works: navigate to page 2 and verify different results', async ({ page }) => {
    const equitiesPage = new EquitiesSearchPage(page);
  
    await equitiesPage.navigate();
    await equitiesPage.acceptCookiesIfVisible();
    await equitiesPage.waitForEquitiesTable();
  

    const firstCompanyPage1 = await equitiesPage.getRowTextByIndex(0);
    console.log(`Page 1 first company: "${firstCompanyPage1}"`);
  
    await equitiesPage.goToPage(2);
  
    const firstCompanyPage2 = await equitiesPage.getRowTextByIndex(0);
    console.log(`Page 2 first company: "${firstCompanyPage2}"`);
  
    expect(firstCompanyPage2.trim()).not.toBe(firstCompanyPage1.trim());
  });
  
  



});
