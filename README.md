# PaySplit Web

PaySplit routes a salary into wallets and transfers automatically, by rules the user sets. This repository is the **web app**: React and TypeScript, built to the PaySplit Figma and running against the provided PaySplit API.

- **Live app:** https://paysplit-bice.vercel.app
- **Demo video:** _add the link here_
- **Tool-choice writeup:** [docs/TOOL-CHOICES.md](docs/TOOL-CHOICES.md)

## Run it

Requirements: [Bun](https://bun.sh) 1.4+ (Node 22 also works for the scripts).

```bash
bun install
cp .env.example .env        # optional: the app defaults to the provided sandbox API
bun run dev                 # http://localhost:5173
```

| Command | What it does |
|---|---|
| `bun run dev` | Dev server |
| `bun run build` | Typecheck and production build to `dist/` |
| `bun run check` | Typecheck, lint and unit tests (run this before a commit) |
| `bun run test` | Unit and component tests (Vitest, Testing Library, MSW) |
| `bunx playwright install chromium` then `bun run e2e` | Builds, serves and runs end-to-end tests with axe at desktop and 360px |
| `bun run build && bun run preview` then `bun run perf` | Measures the sign-in page on the production build (see Performance) |

The only setting is `VITE_API_BASE_URL`, the public API base URL. It is not a secret.

## What is in the app

| Brief requirement | Where |
|---|---|
| Sign up, email code, password, sign in, forgot password | `src/pages/auth` |
| KYC: profile, BVN/NIN or document, liveness (camera or upload) | `src/pages/kyc`, `src/features/kyc` |
| Dashboard: balance, next split, recent activity, verification status | `src/pages/dashboard`, `src/features/dashboard` |
| Split-rule builder: fixed or percentage, priority, over-allocation check | `src/features/rules`, `src/pages/rules` |
| Run Now with review and result, split history | `src/features/runs` |
| Wallets and beneficiaries: create, edit, delete, move money back, account-name lookup | `src/pages/destinations`, `src/features/wallets`, `src/features/beneficiaries` |
| Transactions: filters, detail, printable receipt, CSV statement | `src/pages/transactions`, `src/features/transactions` |
| Settings and notifications | `src/pages/settings`, `src/pages/notifications` |
| Setup checklist wizard (income, wallet, beneficiary, rule) | `src/pages/setup` |

## How it is built

```
src/
  api/          one fetch client, typed errors, error-code messages, query client
  app/          routes (every page lazy-loaded), guards, app shell, providers
  components/   shared UI: Button, TextField, Modal, states (loading, empty, error)
  features/     one folder per domain: api calls, forms, domain components
  pages/        route components that compose features
  lib/          money, dates, phone, safe redirects (pure, unit tested)
```

- **Server data lives in TanStack Query only**; forms in React Hook Form with Zod; the session in one small store. No global state library is needed.
- **Every screen goes through one `QueryView`**, so each has loading, error with retry, empty, and success states. When a background refresh fails it keeps the data and says so.
- **Forms are reused**: the same wallet, beneficiary, income and rule forms work in modals, detail pages and the setup wizard.

### Money

- Amounts are **integer minor units** (kobo) end to end. `parseFloat` is banned by a lint rule.
- Formatting uses `Intl.NumberFormat` with the **currency from the record**. Decimal places come from the currency (tests cover JPY with 0 and KWD with 3).
- Typed amounts are parsed from strings straight to minor units (`src/lib/money.ts`), respecting locale separators.
- Percentages are parsed into **basis points** and applied with **BigInt, rounding down**, so a preview never promises more than the salary. A test shows a case where floating point would over-allocate by one kobo.
- A rule that would over-allocate the salary is **blocked before it is sent**, with the exact shortfall.

### Time

- The API's day boundaries are **Lagos time**, so every date is shown in `Africa/Lagos` with an explicit time zone, never the browser's.
- Date-only values are treated as calendar days, not instants.
- Unit tests and Playwright both run in `America/Los_Angeles`, and the tests include instants near midnight UTC, so a time-zone bug fails in CI.

### Accessibility (WCAG 2.2 AA)

- axe runs in the end-to-end suite on every public page, including after a failed submit, at desktop and 360px. All nine signed-in pages (dashboard, destinations, wallet detail, split rules, transactions, settings, notifications, KYC, setup) were scanned with axe in the browser on a real account: 0 violations.
- Labels on every field, errors linked with `aria-describedby`, focus moved to the page or step heading on navigation, skip link, visible focus, 44px or larger targets, keyboard-only sign-in tested.
- Dialogs, menus, tabs and switches use Radix for focus trapping and keyboard support. The chart has a screen-reader data table.
- **Contrast**: the Figma's bright blue with white text (2.63:1) and several greys fail AA. We kept the blue and used colours from the designer's own palette that pass (details in Design deviations).

### Security

- **Token**: kept in `sessionStorage` (cleared when the tab closes), or `localStorage` only if the user ticks "Remember for 30 days". The API issues a bearer token with no refresh token or cookie option.
- **Session end**: only a 401 that means "invalid session" signs the user out (a 401 for "wrong current password" does not). Signing in, out or expiring wipes all cached data, and signing out in one tab signs out the others.
- **No XSS surface**: React escaping, `dangerouslySetInnerHTML` banned by lint, no third-party scripts.
- **Headers** in `vercel.json`: strict Content-Security-Policy (scripts from self only, network only to the PaySplit API), `frame-ancestors 'none'`, `no-referrer`, camera allowed for self only.
- **Data handling**: no open redirects (`?next=` must be an internal path); BVN and NIN are never stored, logged or put in URLs; account numbers are masked; files are type and size checked before upload.
- **Money actions** lock while pending, and moving money has a review step, because the API has no idempotency key.

## Testing and evidence

- **103 unit and component tests**: money, dates, allocation maths, and user journeys against a fake API (MSW) that fails on any unexpected request.
- **14 end-to-end runs**: Playwright plus axe at desktop and 360px.
- Tests were written first for the money, date and allocation code. Key guards were proven by breaking them on purpose and watching the test fail.
- **Checked against the real API**: sign-up and email verification, wallet creation (a typed "100,000" was saved as exactly 10,000,000 kobo), and the KYC rule refusal described below.

## Performance

Measured with `scripts/perf.mjs` on the production build: Chromium, 150 ms round trip, 1.6 Mbps, CPU 4x slower, cache off, median of 3 runs on `/sign-in`.

| | First paint | JavaScript downloaded |
|---|---|---|
| Before: signed-in shell in the main bundle | 1,692 ms | 192 KB |
| After: shell lazy-loaded | 1,504 ms | 156 KB |
| **Improvement** | **11% faster** | **19% less** |

The shell is then prefetched when the browser is idle, after first paint (1,496 ms), so signing in does not wait for a download. Adding the self-hosted Inter font afterwards left first paint at 1,508 ms: it uses `font-display: swap`, so text shows at once, and adds about 48 KB. Every page is a lazy route, so the chart library only loads on the dashboard. No data is hidden or truncated to get these numbers.

## Product decisions and open questions

The API contract is treated as the source of truth (Project Scope, section 8). Where the PRD and the API disagree, the UI does what the API actually does and says so.

| # | PRD | API (checked) | What the app does |
|---|---|---|---|
| 1 | Percentage rules use the original salary (FR-15) | Run Now applies percentages to the balance at run time | The preview is labelled as based on your monthly salary; Run Now says PaySplit confirms final amounts |
| 2 | Draft rules allowed before KYC (FR-06) | `POST /split-rules` returns `KYC_REQUIRED`, even with `status: paused` (tested live) | Rule creation explains it unlocks after verification, instead of a form that fails |
| 3 | Beneficiaries can be added before KYC (FR-06) | `POST /beneficiaries/resolve` returns `KYC_REQUIRED` for unverified users (tested live) | The lookup shows the reason and saving stays blocked |
| 4 | Fees shown when moving money (FR-11) | No fee in any response | No fee is shown; nothing is invented |
| 5 | PDF statements | CSV export only | CSV download plus printable statement and receipt (Save as PDF) |
| 6 | Wallet description, beneficiary name field | Not in the API; the name comes from bank lookup | Built to the API; the resolved name must show before saving |
| 7 | Admin dashboard | Admin endpoints exist | Out of scope for the Frontend role brief |

**Questions for the product owner:** should unverified users be able to save draft rules (#2) and beneficiaries (#3)? Which base should percentages use (#1)?

## Design deviations from Figma (and why)

- **Contrast**: primary buttons keep the `#33A7F5` fill with a navy `#0F324A` label (5.07:1 instead of 2.63:1). Links and field borders use darker shades from the Figma palette.
- **Copy**: "Sign in" instead of "Confirm", for a clearer button label (WCAG 2.4.6). "Email" instead of "Email or phone number", because the API only accepts email.
- **Phones**: Figma has desktop web frames only. Phones get a bottom tab bar based on the mobile app design; every page is checked at 360px with no sideways scrolling.
- **Additions**: Run Now, split history, transaction status and date filters, which the PRD requires but the Figma omits.
- **Removed**: the "Contact support" card, because there is no real support destination.

## Known limits

- The demo account is not KYC-verified, so transaction, notification, rule and split-run responses could not be observed live. Their types follow the PRD and API docs and are rendered defensively. They need confirming with a verified account and a simulated salary credit (`POST /salary-account/simulate-credit`).
- End-to-end tests cover the public pages. Signed-in journeys are covered by component tests against a fake API, plus manual axe scans.
