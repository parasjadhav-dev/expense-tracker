# Expense Tracker

A budget-focused expense tracker built with Next.js, TypeScript, Prisma and PostgreSQL.
Set category budgets, get overspend alerts, and see your daily safe-to-spend amount.

> **Status: Week 1 of 3 complete, Week 2 in progress.** Accounts, full expense
> management, budgets with progress bars and alerts, and a dashboard with summary cards
> (spent, remaining, safe to spend per day) work.
> Two charts are on the dashboard (spending by category and a six-month trend); CSV import,
> tests and deployment are still to come.
> See [Progress](#progress) for exactly what is and is not built.

## Progress

| Phase | Scope | Status |
|---|---|---|
| Week 1: Foundation | Sign-up, login/logout, protected routes, responsive layout, add / list / filter / edit / delete expenses | **Done** |
| Week 2: Budgets and dashboard | Monthly and per-category budgets, progress bars, overspend alerts, safe-to-spend per day, summary cards, charts | **In progress:** budgets, progress bars, alerts, safe-to-spend, the summary cards and both charts (category breakdown, six-month trend) and the dashboard month selector (earlier months, via `?month=YYYY-MM`) are done, and empty, loading and error states are done; only the Week 2 review is left |
| Week 3: Import, tests, deploy | CSV import with auto-categorisation, Vitest unit tests, Vercel deployment | Not started |
| Final: Polish | Screenshots, live link, README finish | Not started |

### What works today

- **Interface:** a public landing page, split-screen login and sign-up, an app shell with a sidebar (mobile menu on phones), a dashboard with a two-column chart grid plus recent expenses and budget status, expense forms next to a list of recent expenses, loading skeletons and a styled 404. Logged-in visitors to `/` go straight to the dashboard.
- **Empty, loading and error states:** every page has an empty state that says what is missing and offers the next step; loading skeletons keep the page's shape while data streams in; if the database is unavailable a page shows a "Something went wrong" card with Try again (the sidebar stays), and a failed save shows a message and keeps what was typed. Error details are logged on the server and never shown.
- **Accounts:** email and password sign-up (Zod validation, bcrypt hashing), login and logout with Auth.js, sessions that survive a reload.
- **Protected routes:** `/dashboard`, `/expenses/*` and `/budgets` redirect logged-out visitors to the login page and back again afterwards. Logged-in users are kept out of the login and sign-up pages.
- **Expenses:**
  - add, edit and delete (delete asks for confirmation);
  - list filtered by month and category, with the count and total for the filter;
  - amounts entered in rupees, stored as integer paise;
  - 9 default categories created for every new account.
- **Budgets** (`/budgets`, one month at a time):
  - an overall monthly budget and a limit per category (a blank field means no limit);
  - progress bars per budget: green below 80%, amber from 80%, red at 100% and over;
  - warning banners from 80%, and red banners when a budget is used up or exceeded, also shown on the dashboard;
  - **safe to spend per day:** what is left of the overall budget divided by the days left in the month, counting today and rounded down to the paisa.
- **Dashboard** (current month): the budget alerts plus three summary cards:
  - spent this month, with the share of the overall budget used;
  - remaining of the overall budget (shown in red and negative when overspent);
  - safe to spend per day.
- **Spending by category** chart on the dashboard: ranked horizontal bars (Recharts), largest first,
  with each amount at the bar tip, a hover tooltip, and a "View as table" toggle listing every
  category with its exact share. With more than 8 categories the smallest are grouped as "All other".
- **Monthly spending** trend chart on the dashboard: a line with an area wash for the last six
  months (the current month and the five before it, in the app time zone). Months with no spending
  show as zero. The current month is month-to-date, so its marker is hollow and its tooltip says
  "so far". The latest month and the peak are labelled; the y axis uses clean round ticks; and a
  "View as table" toggle lists every month with its exact total.
- **Responsive layout:** sidebar on laptop widths, top bar with a menu on phones.

### Not built yet

- CSV import, recurring expenses, Google login.
- Automated tests. Behaviour so far has been checked by hand and with browser-driven scripts; Vitest is planned for Week 3.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) and TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 with the `pg` driver adapter |
| Auth | Auth.js (`next-auth` v5 beta), credentials provider, JWT sessions |
| Validation | Zod 4 |
| UI | Tailwind CSS 4, Base UI, lucide-react, Inter font |
| Charts | Recharts |
| Tests (planned) | Vitest |
| Hosting (planned) | Vercel |

## Getting started

You need Node.js 20 or newer and a PostgreSQL database (a free [Neon](https://neon.tech) database works).

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in the values below
npx prisma migrate deploy   # create the tables
npx prisma db seed          # optional: demo user and categories (local use only)
npm run dev                 # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Use `sslmode=verify-full`. |
| `AUTH_SECRET` | Signs session cookies. Generate one with `openssl rand -base64 32`. |
| `AUTH_URL` | Public URL of the app. `http://localhost:3000` locally; the live URL when deployed. |
| `APP_TIME_ZONE` | Optional. IANA time zone that decides what "today" and "this month" mean. Defaults to `Asia/Kolkata`. |

`.env` is git-ignored. Never commit real credentials.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client, then build for production |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |

The generated Prisma client (`src/generated/prisma`) is not committed. `npm install` and `npm run build` both generate it, so a fresh clone builds without extra steps.

### Demo account

`npx prisma db seed` creates `demo@example.com` with the password `demo12345`.
This is for local development only. Do not run the seed against a production database.

### Migrations

Apply migrations with `prisma migrate deploy`. One migration adds a partial unique index
(`Budget_overall_userId_month_key`) that Prisma cannot express in `schema.prisma`, so a
future `prisma migrate dev` may try to drop it. Read any generated migration before applying it.

## Project structure

```
app/
  (app)/                 signed-in pages sharing the sidebar layout
    dashboard/           summary cards, charts, recent expenses, month selector
    expenses/            list, add (new/) and edit ([id]/edit/)
  api/auth/[...nextauth] Auth.js route handler
  login/  sign-up/       public auth pages
components/app/          navigation, expense form, delete dialog
lib/                     db client, auth, money and date helpers, validation schemas
prisma/                  schema, migrations, seed
proxy.ts                 route protection (the Next 16 name for middleware)
```

## Design notes

- **Money is integer paise.** `₹199.50` is stored as `19950`. Input is parsed with string
  arithmetic, never floating point, and the column is a 32-bit integer (maximum ₹21,474,836.47).
- **Dates are calendar dates.** An expense date is stored at UTC midnight, so it never shifts
  into another day or month because of a time zone. Month filters use the same boundaries.
- **One app time zone.** The server cannot know each user's time zone, so "today" and the
  current month follow `APP_TIME_ZONE` (default `Asia/Kolkata`). This is what the safe-to-spend
  figure counts days from, and it rolls over at local midnight, not UTC midnight. An invalid
  value fails with a clear message in the server log.
- **Budget maths is pure.** `lib/budget.ts` has no database, clock or other imports; callers pass
  the data and today's date in, so every rule (thresholds, alerts, safe-to-spend) is easy to test.
- **Authorisation does not rely on the proxy alone.** `proxy.ts` redirects early, but every
  protected page and every server action checks the session itself, and every query is scoped
  to the signed-in user's id. Updates and deletes match on both the record id and the user id.
- **The database client is created on first use**, so building without `DATABASE_URL` works.
  The first query without it fails with a clear message.

## Known limitations

- No rate limiting on login or sign-up, no email verification and no password reset.
- Sign-up reveals whether an email is already registered.
- The expense list shows the latest 100 matches (the total still covers all of them); there is no pagination.
- `npm audit` reports findings in development tooling (`shadcn`, `eslint-config-next`, `typescript-eslint`).
  None are in runtime dependencies, and none have been force-fixed.
- `next-auth` v5 is still a beta release.
- Dark-mode styles exist (they follow the `.dark` class) but nothing switches them on yet: there is no theme toggle and the app does not follow the OS setting.
- Category chart colours are fixed per chart, not per category: the bars are one hue because a donut or pie with stable per-category colours cannot keep every neighbouring pair of slices distinguishable. Identity comes from the labels.
