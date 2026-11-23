import { expect, test } from '@playwright/test';

test.describe('Products API', () => {
  test('lists products with pagination metadata', async ({ request }) => {
    const response = await request.get('/products?page=1');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.current_page).toBe(1);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(body.per_page);
    expect(body.total).toBeGreaterThanOrEqual(body.data.length);
  });

  test('every product has a name, a positive price and a category', async ({ request }) => {
    const { data } = await (await request.get('/products?page=1')).json();
    for (const product of data) {
      expect(product.name, product.id).toBeTruthy();
      expect(product.price, product.id).toBeGreaterThan(0);
      expect(product.category?.name, product.id).toBeTruthy();
    }
  });

  test('returns a single product by id', async ({ request }) => {
    const { data } = await (await request.get('/products?page=1')).json();
    const first = data[0];

    const response = await request.get(`/products/${first.id}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ id: first.id, name: first.name, price: first.price });
  });

  test('returns 404 for an unknown product id', async ({ request }) => {
    const response = await request.get('/products/UNKNOWN-ID-123');
    expect(response.status()).toBe(404);
  });

  test('search only returns matching products', async ({ request }) => {
    const response = await request.get('/products/search', { params: { q: 'pliers' } });
    expect(response.status()).toBe(200);

    const { data } = await response.json();
    expect(data.length).toBeGreaterThan(0);
    for (const product of data) {
      expect(product.name.toLowerCase()).toContain('pliers');
    }
  });

  test('search with no matches returns an empty list', async ({ request }) => {
    const response = await request.get('/products/search', { params: { q: 'zzz-no-such-tool' } });
    expect(response.status()).toBe(200);
    expect((await response.json()).data).toEqual([]);
  });
});
