import { Page, Locator, expect } from '@playwright/test';

export class EquitiesSearchPage {
  readonly page: Page;
  readonly cookieBanner: Locator;
  readonly acceptCookiesButton: Locator;
  readonly searchInput: Locator;
  readonly resultsTable: Locator;
  readonly tableRows: Locator;
  readonly moreInfoButton: Locator;
  readonly lockIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cookieBanner = page.locator('#iubenda-cs-banner');
    this.acceptCookiesButton = page.locator('button:has-text("Accept")');
    this.searchInput = page.locator('input[placeholder="Enter name, ISIN, or ticker"]');
    this.resultsTable = page.locator('.elementor-widget-stocksearchlist table');
    this.tableRows = page.locator('.elementor-widget-stocksearchlist table tr');
    this.moreInfoButton = page.locator('.me-btn-secondary:has-text("More information")');
    this.lockIcon = page.locator('.text-success-400'); 
  }

  async navigate() {
    await this.page.goto('https://www.medirect.com.mt/invest/equities/search');
  }

  async acceptCookiesIfVisible() {
    if (await this.cookieBanner.isVisible()) {
      await this.acceptCookiesButton.click();
      
      await this.page.waitForTimeout(1000); // had to wait for banner to remove
    }
  }

  async waitForEquitiesTable() {
    await this.resultsTable.waitFor({ state: 'visible', timeout: 30000 });
  }

  async getRowCount(): Promise<number> {
    // this is to select table row that is not header
    return this.page.locator('.elementor-widget-stocksearchlist table tr:not(.me-tbl-header-row)').count();
  }

  async searchForStock(stockName: string) {
    console.log(`🔍 Searching for stock: ${stockName}`);
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
    const rows = this.page.locator('.elementor-widget-stocksearchlist table tr:not(.me-tbl-header-row)'); // all rows
    
    const count = await rows.count();
    const rowTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      rowTexts.push(await rows.nth(i).innerText());
    }
    return rowTexts;
  }

  async goToPage(pageNumber: number) {
    const pageButton = this.page.locator(`li.me-pagination-li[data-t="page-button-${pageNumber}"]`);
    await pageButton.waitFor({ state: 'visible', timeout: 5000 });
  
    await pageButton.click();
  
    await this.page.locator(`li.me-pagination-li.selected[data-t="page-button-${pageNumber}"]`).waitFor({
      state: 'visible',
      timeout: 10000, 
    });
  
    const firstRowBefore = await this.getRowTextByIndex(0);
    await this.page.waitForFunction(
      (prevRowText) => {
        const firstRowText = document.querySelector('.elementor-widget-stocksearchlist table tr:not(.me-tbl-header-row)')?.textContent?.trim();
        return firstRowText !== prevRowText;
      },
      firstRowBefore, 
      { timeout: 10000 } 
    );
  }
  
    

  async getRowTextByIndex(index: number): Promise<string> {
    const rows = this.page.locator('.elementor-widget-stocksearchlist table tr:not(.me-tbl-header-row)');
    
    return rows.nth(index).locator('td:nth-child(2)').innerText();  
  }
  
  

}
