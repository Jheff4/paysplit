# Tool choices

What I used to build the PaySplit web app, and why. Everything is free and open source; hosting is on Vercel's free tier.

## Language and framework

| Tool | Why |
|---|---|
| **TypeScript (strict)** | Money and dates are the risky parts of this product. Strict types, including `noUncheckedIndexedAccess`, catch "this might be missing" bugs at compile time. Pinned to 6.x because the lint tooling does not support TypeScript 7 yet. |
| **React 19** | The brief asks for a component-based web UI; React has the most mature accessibility tooling (Radix, Testing Library) and hiring pool. |
| **Vite** | Fast dev server and small, code-split production builds with no configuration overhead. A single-page app fits: there is no SEO need behind a login, and the API is a separate service. |
| **React Router** | Nested layouts (public pages and the signed-in shell), lazy routes so each page downloads only when visited, and URL state (tabs, filters, open dialogs) that survives refresh and can be shared. |

## Data and state

| Tool | Why |
|---|---|
| **TanStack Query** | All server state, with consistent loading, error, retry and cache behaviour. It gave every screen the same states through one `QueryView` component. Mutations never auto-retry, so a money action cannot be sent twice by accident. |
| **No global state library** | Server data lives in Query, form data in React Hook Form, and the session in a 60-line store. Adding Redux or Zustand would add a second source of truth for no benefit. |
| **React Hook Form + Zod** | Field-level validation that mirrors the API's request shapes, focuses the first error, and keeps typing fast (uncontrolled inputs). Zod schemas double as documentation of what the API accepts. |

## UI

| Tool | Why |
|---|---|
| **Tailwind CSS v4** | Figma tokens (colours, radii, shadows) live as CSS variables in one `@theme` block, so matching the design and the responsive breakpoints stays consistent. No runtime CSS-in-JS cost. |
| **Radix UI primitives** | Dialogs, alert dialogs, menus, radio groups and switches with correct focus trapping, keyboard support and ARIA. Unstyled, so they match the Figma exactly. Building these by hand is where accessibility usually breaks. |
| **@fontsource-variable/inter** | The Figma's Inter font, self-hosted with the app, so the Content-Security-Policy can stay `font-src 'self'` and no request goes to Google Fonts. |
| **lucide-react** | Consistent, tree-shaken icons, matching the Figma's line icons. |
| **Recharts** | The cash-flow bar chart (positive and negative bars). Lazy-loaded with the dashboard only; a hidden data table provides the same information to screen readers. |

## Quality

| Tool | Why |
|---|---|
| **Vitest** | Fast tests with Vite's config and path aliases. Tests run in the Los Angeles time zone to catch time-zone bugs. |
| **Testing Library** | Tests act like a user: find a field by its label, type, click, read what appears. A missing label makes the test fail, so tests double as accessibility checks. |
| **MSW (Mock Service Worker)** | A fake API at the network level for tests only. It fails on any request a test did not expect, so no test silently calls the real sandbox. |
| **Playwright + axe-core** | Real-browser tests of the production build at desktop and 360px, with an automated WCAG 2.2 AA scan on each page, including after a failed submit. Playwright also powers the performance script. |
| **ESLint (typescript-eslint, jsx-a11y strict, React hooks)** | Catches accessibility and hook mistakes, plus two project rules: no `parseFloat` (money) and no `dangerouslySetInnerHTML` (XSS). |
| **Prettier** | One code style, no debates. |

## Tooling and hosting

| Tool | Why |
|---|---|
| **Bun** | Much faster installs than npm, and runs the standard `package.json` scripts. Tests run through Vitest (`bun run test`), not Bun's own test runner. |
| **Vercel (free tier)** | Deploys from GitHub on push, serves the SPA with rewrites, and applies the security headers from `vercel.json` (Content-Security-Policy, frame-ancestors, referrer and permissions policies). |
| **Figma** | The source of truth for the UI. Sizes, colours, radii and copy were taken from the file's values, not eyeballed from screenshots. |

## Deliberately not used

- **A component library such as MUI or Chakra**: it would fight the Figma's look; Radix plus Tailwind matches it exactly.
- **A date library**: `Intl.DateTimeFormat` with an explicit `timeZone` covers formatting, and day boundaries come from the API as Lagos calendar dates.
- **A money library**: the rules here (integer minor units, currency-driven decimals, BigInt for percentages) fit in one small, fully tested file.
- **Next.js or server rendering**: everything is behind a login and the API is separate, so a static SPA is simpler, cheaper and free to host.
