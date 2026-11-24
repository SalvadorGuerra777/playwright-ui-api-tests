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

    // The account page has a guard: with no valid token it sends the user back to the login form
    await page.getByTestId('page-title').or(page.getByTestId('login-form')).waitFor();
    const session = await page.evaluate(() => {
      const token = localStorage.getItem('auth-token');
      const claims = token ? JSON.parse(atob(token.split('.')[1])) : null;
      return { path: location.pathname, exp: claims?.exp, clientTime: Math.floor(Date.now() / 1000) };
    });
    expect(session.path, JSON.stringify(session)).toBe('/account');
    expect(session.exp, 'token should not be expired on the client').toBeGreaterThan(session.clientTime);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
  });

  test('unknown credentials show an error', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(unknownUser.email, unknownUser.password);

    await expect(loginPage.error).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
