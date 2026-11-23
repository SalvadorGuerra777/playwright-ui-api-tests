import { expect, test } from '@playwright/test';
import { customer, unknownUser } from '../../test-data';

test.describe('Login API', () => {
  test('valid credentials return a bearer token', async ({ request }) => {
    const response = await request.post('/users/login', { data: customer });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.token_type).toBe('bearer');
    expect(body.access_token).toEqual(expect.any(String));
    expect(body.expires_in).toBeGreaterThan(0);
  });

  test('token gives access to the current user', async ({ request }) => {
    const { access_token } = await (await request.post('/users/login', { data: customer })).json();

    const response = await request.get('/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).email).toBe(customer.email);
  });

  test('unknown credentials are rejected with 401', async ({ request }) => {
    const response = await request.post('/users/login', { data: unknownUser });
    expect(response.status()).toBe(401);
  });

  test('current user endpoint requires a token', async ({ request }) => {
    const response = await request.get('/users/me');
    expect(response.status()).toBe(401);
  });
});
