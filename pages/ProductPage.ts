import { Locator, Page } from '@playwright/test';

export class ProductPage {
  readonly name: Locator;
  readonly ecoBadge: Locator;
  readonly price: Locator;
  readonly quantity: Locator;
  readonly cartQuantity: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('product-name');
    this.ecoBadge = this.name.getByTestId('eco-badge');
    this.price = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }

  async open(id: string) {
    // wait for the product data, otherwise the form can reset the quantity after we type it
    await Promise.all([
      this.page.waitForResponse((res) => res.url().endsWith(`/products/${id}`)),
      this.page.goto(`/product/${id}`),
    ]);
    await this.name.waitFor();
  }

  async addToCart(quantity = 1) {
    await this.quantity.fill(String(quantity));
    await this.page.getByTestId('add-to-cart').click();
  }
}
