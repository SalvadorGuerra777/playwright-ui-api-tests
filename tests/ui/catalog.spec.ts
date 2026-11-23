import { expect, test } from '../../fixtures';

test.describe('Catalog', () => {
  test('search shows only matching products', async ({ homePage }) => {
    await homePage.open();
    await homePage.search('pliers');

    const names = await homePage.names();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.toLowerCase()).toContain('pliers');
    }
  });

  test('sorting by price low to high orders the prices', async ({ homePage }) => {
    await homePage.open();
    await homePage.sortBy('price,asc');

    const prices = await homePage.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sorting by name Z to A orders the names', async ({ homePage }) => {
    await homePage.open();
    await homePage.sortBy('name,desc');

    const names = await homePage.names();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });
});
