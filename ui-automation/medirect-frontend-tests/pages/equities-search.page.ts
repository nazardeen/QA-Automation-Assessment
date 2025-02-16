import { Page, Locator } from '@playwright/test';

export class EquitiesSearchPage {
  readonly page: Page;
  readonly cookieBanner: Locator;
  readonly acceptCookiesButton: Locator;
  readonly searchInput: Locator;
  readonly resultsTable: Locator;
  readonly dataRows: Locator;
  readonly moreInfoButton: Locator;
  readonly lockIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cookieBanner = page.locator('#iubenda-cs-banner');
    this.acceptCookiesButton = page.locator('button:has-text("Accept")');
    this.searchInput = page.locator('input[placeholder="Enter name, ISIN, or ticker"]');
    this.resultsTable = page.locator('.elementor-widget-stocksearchlist table');
    this.dataRows = page.locator('.elementor-widget-stocksearchlist table tr:not(.me-tbl-header-row)');
    this.moreInfoButton = page.locator('.me-btn-secondary:has-text("More information")');
    this.lockIcon = page.locator('.text-success-400');
  }

  async navigate() {
    await this.page.goto('https://www.medirect.com.mt/invest/equities/search');
  }

  async acceptCookiesIfVisible() {
    if (await this.cookieBanner.isVisible()) {
      await this.acceptCookiesButton.click();
      await this.cookieBanner.waitFor({ state: 'hidden' });
    }
  }

  async waitForEquitiesTable() {
    await this.resultsTable.waitFor({ state: 'visible' });
  }

  async getRowCount(timeout: number = 10000): Promise<number> {
    try {
      await this.dataRows.first().waitFor({ state: 'visible', timeout });
    } catch {
      console.log(`Warning: No rows found within ${timeout / 1000} seconds.`);
    }
    return this.dataRows.count();
  }

  async searchForStock(stockName: string) {
    console.log(`Searching for stock: ${stockName}`);
    await this.searchInput.fill(stockName);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async clickMoreInformationOnFirst() {
    const rowCount = await this.getRowCount();
    if (rowCount === 0) {
      throw new Error('No equities found to click on More Information');
    }
    await this.moreInfoButton.first().scrollIntoViewIfNeeded();
    await this.moreInfoButton.first().click();
  }

  async getRowTexts(): Promise<string[]> {
    return this.dataRows.allTextContents();
  }

  async getRowTextByIndex(index: number): Promise<string> {
    return this.dataRows.nth(index).locator('td:nth-child(2)').innerText();
  }

  async goToPage(pageNumber: number) {
    const pageButton = this.page.locator(`li.me-pagination-li[data-t="page-button-${pageNumber}"]`);
    const firstRowBefore = await this.getRowTextByIndex(0);
    await pageButton.click();
    await this.page.waitForFunction(
      (prevText) => {
        const currentRow = document.querySelector('.elementor-widget-stocksearchlist table tr:not(.me-tbl-header-row) td:nth-child(2)');
        return currentRow?.textContent?.trim() !== prevText;
      },
      firstRowBefore,
      { timeout: 10000 }
    );
  }

  async selectSecurityType(type: 'Funds' | 'Equities' | 'ETFs' | 'Bonds') {
    const securityTab = this.page.locator('.me-navigation-tabs a p.me-text', { hasText: type });
    await securityTab.click();
    console.log(`Clicked on ${type} tab...`);
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    if (type === 'ETFs') {
      const disclaimerPopup = this.page.locator('text=Disclaimer prior to allowing the search');
      if (await disclaimerPopup.isVisible({ timeout: 3000 })) {
        console.log('Disclaimer popup detected. Accepting...');
        await this.page.locator('text=Accept and start searching').click();
        await disclaimerPopup.waitFor({ state: 'hidden', timeout: 10000 });
        console.log('Disclaimer accepted and closed.');
      }
    }
    await securityTab.waitFor({ state: 'visible', timeout: 5000 });
    const tableExists = await this.resultsTable.count();
    if (tableExists === 0) {
      console.log(`Warning: Table element is missing after switching to ${type} tab.`);
    }
    await this.resultsTable.waitFor({ state: 'visible', timeout: 20000 });
    await this.dataRows.first().waitFor({ state: 'visible', timeout: 20000 });
    console.log(`Successfully switched to ${type} tab.`);
  }
}
