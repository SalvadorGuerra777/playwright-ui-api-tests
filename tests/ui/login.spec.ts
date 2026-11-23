import { customer, unknownUser } from '../../test-data';
import { expect, test } from '../../fixtures';

test.describe('Login', () => {
  test('customer can sign in and reach their account', async ({ page, loginPage }) => {
    await loginPage.open();
    // the app also calls /users/me without a token on page load; wait for the authenticated call
    const profileResponse = page.waitForResponse(
      (res) => res.url().includes('/users/me') && !!res.request().headers()['authorization'],
    );
    await loginPage.login(customer.email, customer.password);

    expect((await profileResponse).status()).toBe(200);
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
