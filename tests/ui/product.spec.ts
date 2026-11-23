import { API_URL } from '../../playwright.config';
import { expect, test } from '../../fixtures';

test.describe('Product page', () => {
  test('shows the same name and price as the API', async ({ request, productPage }) => {
    const { data } = await (await request.get(`${API_URL}/products?page=1`)).json();
    const product = data[0];

    await productPage.open(product.id);
    await expect(productPage.name).toHaveText(product.name);
    await expect(productPage.price).toHaveText(product.price.toFixed(2));
  });

  test('adding to cart updates the cart quantity', async ({ request, productPage }) => {
    const { data } = await (await request.get(`${API_URL}/products?page=1`)).json();
    const inStock = data.find((product: { in_stock: boolean }) => product.in_stock);

    await productPage.open(inStock.id);
    await productPage.addToCart(2);
    await expect(productPage.cartQuantity).toHaveText('2');
  });
});
