# playwright-ui-api-tests

![Playwright tests](https://github.com/SalvadorGuerra777/playwright-ui-api-tests/actions/workflows/playwright.yml/badge.svg)

UI and API tests in one Playwright project for [Practice Software Testing](https://practicesoftwaretesting.com), a demo hardware store built for practicing test automation. The API tests hit its REST API directly, and the UI tests drive the web app through page objects. Some UI tests read data from the API first, so the UI is checked against the backend instead of hard-coded values.

## Tech stack

- Playwright Test with TypeScript
- Page Object Model with Playwright fixtures
- Playwright `request` context for API tests
- GitHub Actions

## Project structure

```
├── pages/                  # Page objects: HomePage, ProductPage, LoginPage
├── tests/
│   ├── api/                # Products and login API tests
│   └── ui/                 # Catalog, product page and login UI tests
├── fixtures.ts             # Injects page objects into tests
├── test-data.ts            # Demo account, overridable through environment variables
├── playwright.config.ts    # "api" and "ui" projects, traces and screenshots on failure
└── .github/workflows/playwright.yml
```

## Setup

```bash
git clone https://github.com/SalvadorGuerra777/playwright-ui-api-tests.git
cd playwright-ui-api-tests
npm install
npx playwright install chromium
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `UI_URL` | `https://practicesoftwaretesting.com` | Web app under test |
| `API_URL` | `https://api.practicesoftwaretesting.com` | REST API under test |
| `CUSTOMER_EMAIL` | `customer2@practicesoftwaretesting.com` | Demo account published in the app's docs |
| `CUSTOMER_PASSWORD` | `welcome01` | Demo account password |

Locally the tests run against the public demo. CI sets `UI_URL=http://localhost:4200` and `API_URL=http://localhost:8091` and runs the same app in Docker (see [CI](#ci)).

## Running the tests

```bash
npm test             # API and UI
npm run test:api     # API only
npm run test:ui      # UI only
npm run report       # open the last HTML report
npx playwright test --project=ui --headed   # watch the browser
```

Failed tests keep a screenshot and a trace (`npx playwright show-trace <trace.zip>`). In CI the HTML report is uploaded as the `playwright-report` artifact, failed tests are retried up to twice, and tests run on a single worker.

## CI

The workflow checks out the app's source ([testsmith-io/practice-software-testing](https://github.com/testsmith-io/practice-software-testing), pinned to one commit), starts it with `docker compose`, seeds a fresh database and runs the whole suite against it. If a test fails, the app's container logs are printed in the job.

Why not the public demo: the demo is behind Cloudflare. A diagnostic run on GitHub-hosted runners showed that after a successful login (`POST /users/login` 200) the `/account` page answers `403` with a bot check ("Just a moment... Performing security verification"), so the page never renders. Blocking third-party scripts made no difference. Getting around a bot check is not something a test suite should do, so CI tests its own copy of the app instead, which also removes the shared demo's slow and changing data from CI results.

## What is covered

17 tests:

| Area | Checks |
|---|---|
| Products API | Pagination metadata, every product has a name, a positive price and a category, get by id, 404 for an unknown id, search returns only matches, search with no matches returns an empty list |
| Login API | Valid login returns a bearer token, the token gives access to `/users/me`, unknown credentials return 401, `/users/me` without a token returns 401 |
| Catalog UI | Search shows only matching products, sort by price ascending, sort by name descending |
| Product UI | Name and price match the API, adding two units updates the cart quantity |
| Login UI | Customer signs in, the login request succeeds and "My account" loads; unknown credentials show an error and stay on the login page |

Last local run with CI settings: `51 passed` with `--repeat-each=3` to check for flaky tests.

## Design decisions

- Locators use the app's `data-test` attributes (`testIdAttribute: 'data-test'`), so tests don't depend on styling or copy.
- No fixed waits. After a search or sort the page object waits for the API response and for the list to re-render, because the previous results stay on screen until then.
- The product page waits for the product API call before typing a quantity; without it the form could reset the value and the cart test was flaky.
- Product data in the shared demo changes (other users add products), so tests read it from the API instead of hard-coding it. The name check also covers the "ECO" badge the app shows inside the heading for eco-friendly products.
- API and UI are separate Playwright projects, so each can run on its own.
- The app is a shared public demo with very uneven response times (I measured page loads from under 1 second to over 20), so timeouts are higher than they would be for an app under our control, and CI uses one worker so the suite doesn't add load to it.
- Negative login tests use an email that doesn't exist. The first version used a wrong password on the shared demo account, and after a few runs the API locked it (`423 Account locked, too many failed attempts`), which broke the positive login test in CI.
