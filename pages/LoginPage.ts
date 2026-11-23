import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.error = page.getByTestId('login-error');
  }

  async open() {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string) {
    await this.page.getByTestId('email').fill(email);
    await this.page.getByTestId('password').fill(password);
    await this.page.getByTestId('login-submit').click();
  }
}
