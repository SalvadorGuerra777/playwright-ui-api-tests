import { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly productNames: Locator;
  readonly productPrices: Locator;

  constructor(private readonly page: Page) {
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
  }

  async open() {
    await this.page.goto('/');
    await this.productNames.first().waitFor();
  }

  async search(term: string) {
    await this.page.getByTestId('search-query').fill(term);
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/products/search')),
      this.page.getByTestId('search-submit').click(),
    ]);
    // the old list stays on screen until the new results render
    const { data } = await response.json();
    await this.page.waitForFunction(
      (count) => document.querySelectorAll('[data-test="product-name"]').length === count,
      data.length,
    );
  }

  async sortBy(option: string) {
    const firstBefore = await this.productNames.first().textContent();
    await this.page.getByTestId('sort').selectOption(option);
    await this.page.waitForFunction(
      (before) => document.querySelector('[data-test="product-name"]')?.textContent !== before,
      firstBefore,
    );
  }

  async names() {
    return (await this.productNames.allTextContents()).map((name) => name.trim());
  }

  async prices() {
    return (await this.productPrices.allTextContents()).map((price) => Number(price.replace('$', '')));
  }
}
