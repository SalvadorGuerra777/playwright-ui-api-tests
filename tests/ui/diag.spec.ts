// Temporary diagnostic for the account page that never finishes loading on GitHub runners.
// Prints what the page is waiting for as a GitHub notice, then fails on purpose if it hangs.
import { Page } from '@playwright/test';
import { customer } from '../../test-data';
import { test } from '../../fixtures';

function track(page: Page) {
  const start = Date.now();
  const t = () => Date.now() - start;
  const pending = new Map<string, { method: string; at: number }>();
  const failed: string[] = [];
  const slow: string[] = [];
  const errors: string[] = [];
  const events: string[] = [];
  page.on('request', (r) => pending.set(r.url() + '#' + r.method(), { method: r.method(), at: t() }));
  page.on('requestfinished', async (r) => {
    const key = r.url() + '#' + r.method();
    const began = pending.get(key)?.at ?? 0;
    pending.delete(key);
    const status = (await r.response())?.status();
    if (t() - began > 3000 || (status && status >= 400)) slow.push(`${r.method()} ${r.url()} ${status} ${t() - began}ms`);
  });
  page.on('requestfailed', (r) => {
    pending.delete(r.url() + '#' + r.method());
    failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message.slice(0, 200)));
  page.on('load', () => events.push(`load ${page.url()} @${t()}`));
  page.on('domcontentloaded', () => events.push(`dcl ${page.url()} @${t()}`));
  page.on('framenavigated', (f) => f === page.mainFrame() && events.push(`nav ${f.url()} @${t()}`));
  return { t, pending, failed, slow, errors, events };
}

for (const blockAnalytics of [false, true]) {
  test(`account page after login (block analytics: ${blockAnalytics})`, async ({ page, loginPage }) => {
    if (blockAnalytics) await page.route(/cloudflareinsights\.com/, (route) => route.abort());
    const d = track(page);
    await loginPage.open();
    const loginResponse = page.waitForResponse(
      (r) => r.url().includes('/users/login') && r.request().method() === 'POST', { timeout: 30_000 });
    await loginPage.login(customer.email, customer.password);

    const stages: string[] = [];
    try {
      stages.push(`login POST ${(await loginResponse).status()} @${d.t()}`);
      await page.waitForURL('**/account', { waitUntil: 'commit', timeout: 30_000 });
      stages.push(`url /account committed @${d.t()}`);
      await page.getByTestId('page-title').waitFor({ timeout: 30_000 });
      stages.push(`page-title visible @${d.t()}`);
    } catch (e) {
      stages.push(`stopped: ${String(e).split('\n')[0].slice(0, 160)} @${d.t()}`);
    }
    const state = await page.evaluate(() => {
      const token = localStorage.getItem('auth-token');
      const claims = token ? JSON.parse(atob(token.split('.')[1])) : null;
      return {
        readyState: document.readyState,
        path: location.pathname,
        title: document.title,
        bodyText: document.body.innerText.slice(0, 150),
        tokenExp: claims?.exp,
        tokenIat: claims?.iat,
        clientNow: Math.floor(Date.now() / 1000),
      };
    }).catch((e) => ({ evaluateError: String(e).slice(0, 200) }));

    const report = {
      blockAnalytics, stages, state, elapsed: d.t(),
      events: d.events,
      pending: [...d.pending].map(([url, v]) => `${url} since ${v.at}ms`),
      failed: d.failed, slow: d.slow, errors: d.errors,
    };
    // workflow command: GitHub turns this stdout line into a notice annotation on the run
    console.log(`::notice title=diag block=${blockAnalytics}::${JSON.stringify(report)}`);
  });
}
