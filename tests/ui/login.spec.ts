import { customer, unknownUser } from '../../test-data';
import { expect, test } from '../../fixtures';

test.describe('Login', () => {
  test('customer can sign in and reach their account', async ({ page, loginPage }) => {
    await loginPage.open();
    // POST only: the browser sends a CORS preflight (OPTIONS) to the same URL first
    const loginResponse = page.waitForResponse(
      (res) => res.url().includes('/users/login') && res.request().method() === 'POST',
    );
    await loginPage.login(customer.email, customer.password);

    expect((await loginResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
  });

  test('unknown credentials show an error', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(unknownUser.email, unknownUser.password);

    await expect(loginPage.error).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
