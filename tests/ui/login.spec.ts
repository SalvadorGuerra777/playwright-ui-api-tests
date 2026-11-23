import { customer } from '../../test-data';
import { expect, test } from '../../fixtures';

test.describe('Login', () => {
  test('customer can sign in and reach their account', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(customer.email, customer.password);

    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
  });

  test('wrong password shows an error', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(customer.email, 'wrong-password');

    await expect(loginPage.error).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
