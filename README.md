# juliolmuller.com

Personal portfolio of Julio L. Muller, Senior Full Stack Software Engineer in Curitiba, Brazil. Bilingual (English and Brazilian Portuguese), dark only, server-rendered, with a working terminal, a 3D technology cloud and a private admin reachable only from that terminal.

The initial content is fictional demo data; [docs/ADDING_CONTENT.md](docs/ADDING_CONTENT.md) explains how to replace it.

## Features

- **Public site:** Home (hero, about, stack, selected work, résumé, contact, recommended people), `/projects` with a crawlable filter and pagination, project detail pages with a gallery lightbox, a résumé PDF route, and an accessibility statement, all in `/en` and `/pt`.
- **Terminal:** a windowed shell (`Ctrl/Cmd + /`) that knows the site: `help`, `ls`, `cd`, `cat`, `tree`, `open`, `goto`, `lang`, `projects`, `resume`, `neofetch`, `git log` and more, with history and Tab completion. It can be moved, resized, snapped, minimized and maximized, and becomes a bottom sheet on phones.
- **Technology cloud:** a rotating geoid of logos with category filters; the List view is the no-JS, reduced-motion and screen-reader equivalent.
- **Admin:** `su julio` in the terminal opens a session for `/admin`, where every piece of content is edited. Anonymous requests get the same 404 as any unknown URL.
- **Quality bar:** WCAG 2.2 AA, maximal SEO (metadata, JSON-LD, sitemap, hreflang, OG images), strict security headers, and no third-party requests, trackers or cookies for visitors.

## Stack

|                     |                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Framework           | Next.js 16.4 (App Router, Turbopack, `src/proxy.ts`), React 19.3                              |
| Language            | TypeScript 6.0 (strict)                                                                       |
| Styling             | Tailwind CSS 4.3, Geist and JetBrains Mono (self-hosted)                                      |
| i18n                | next-intl 4 (precompiled ICU messages)                                                        |
| Motion              | Motion 14 (`LazyMotion`), CSS animations                                                      |
| Content             | Sanity (server-only HTTP API and `@sanity/client` for writes) or in-memory fixtures           |
| Auth                | HS256 JWT session (`jose`), scrypt password hashes                                            |
| Images              | `next/image`, `sharp` for uploads and fixtures                                                |
| Tests               | Vitest + Testing Library, Playwright (Chromium, WebKit, Firefox, mobile) + axe, Lighthouse CI |
| Runtime and tooling | Bun 1.4 (package manager and Next runtime), Node 24 (ESLint, Vitest, Playwright)              |

## Getting started

```sh
bun install
cp .env.example .env.local   # every variable is optional for a fixtures run
bun run dev                  # http://localhost:3000 → /en
```

With no Sanity variables the site runs on the fixtures adapter (`CONTENT_SOURCE=fixtures`). To try the admin locally, set `SESSION_SECRET` (32+ characters) and `ADMIN_PASSWORD`, open the terminal and type `su julio`.

## Scripts

| Script                                          | What it does                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `dev` / `build` / `start`                       | Next.js development server, production build, production server                                  |
| `lint`, `format`, `format:check`, `typecheck`   | ESLint (jsx-a11y strict), Prettier, `tsc` after route type generation                            |
| `test`, `test:watch`                            | Vitest unit and component tests                                                                  |
| `test:e2e`                                      | Playwright against the production build on port 3100 (run `build` first)                         |
| `check:seo`                                     | §13.10 crawl of every sitemap URL with JavaScript off, plus admin and API header checks          |
| `check:bundle`                                  | First-load and lazy-chunk budgets, admin isolation, server-only secret leaks (run after `build`) |
| `lhci`                                          | Lighthouse CI on Home, `/projects` and a detail page in both locales (mobile, 3 runs)            |
| `i18n:check`                                    | Message catalogs and fixture translations: same keys, no blanks, matching placeholders           |
| `icons:audit`                                   | Every technology resolves to an icon or a deliberate monogram                                    |
| `audit:deps`                                    | `bun audit` at high severity                                                                     |
| `admin:hash`                                    | Prints an `ADMIN_PASSWORD_HASH` for a password                                                   |
| `admin:smoke`                                   | Write-path smoke test against the Sanity `development` dataset (never production)                |
| `sanity:seed`, `sanity:schema`, `content:smoke` | Seed a dataset with the fictional data, print the schema, read-path smoke test                   |
| `fixtures:generate`                             | Regenerates the fixture images and their metadata                                                |

Visual snapshots run in CI; locally use `VISUAL=1 bun run test:e2e visual.spec.ts`.

## Environment variables

All are documented in [.env.example](.env.example). Only `NEXT_PUBLIC_SITE_URL` is public; everything else is server-only and validated at boot (`src/env.ts`).

| Variable                                                    | Required in production | Purpose                                                                                                            |
| ----------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                                      | yes                    | Canonical origin. An https URL also switches on HSTS, `upgrade-insecure-requests` and the `__Host-` session cookie |
| `CONTENT_SOURCE`                                            | no                     | `sanity` or `fixtures`; inferred from the Sanity variables when empty                                              |
| `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION` | yes (Sanity)           | Project `njcnsmax`, dataset `production`                                                                           |
| `SANITY_READ_TOKEN`, `SANITY_WRITE_TOKEN`                   | yes (Sanity)           | Viewer token for reads, Editor token for admin writes                                                              |
| `SANITY_WEBHOOK_SECRET`                                     | recommended            | Signs the `POST /api/revalidate` webhook                                                                           |
| `SESSION_SECRET`                                            | for the admin          | 32+ random characters; rotating it signs everyone out                                                              |
| `ADMIN_PASSWORD_HASH` or `ADMIN_PASSWORD`                   | for the admin          | `bun run admin:hash` output (preferred) or a 16+ character password                                                |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`        | no                     | Search console ownership tags                                                                                      |
| `ADMIN_FIXTURE_WRITES`                                      | never                  | E2E only: lets the admin write demo data in a production build                                                     |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`        | no                     | Reserved; the login rate limiter is in memory (D51)                                                                |

## Deployment (Vercel)

1. Import the repository; Vercel reads `vercel.json` (Bun install, frozen lockfile). The build command is the default `bun run build`.
2. Set the variables above for **Production** (dataset `production`) and **Preview** (dataset `development`, its own tokens). Previews are never indexed (pages carry a `noindex` robots meta unless `VERCEL_ENV` is `production`).
3. Add the domain `juliolmuller.com` and set `NEXT_PUBLIC_SITE_URL=https://juliolmuller.com`.
4. Configure the Sanity webhook to `https://juliolmuller.com/api/revalidate` with `SANITY_WEBHOOK_SECRET` (steps in [docs/SANITY.md](docs/SANITY.md)).
5. Run the launch checklists in [docs/SEO.md](docs/SEO.md) and the manual screen-reader pass in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

Self-hosting works with `bun run build && bun run start` behind a reverse proxy that terminates TLS, compresses responses and **overwrites** `X-Forwarded-For` (the login rate limiter trusts its first entry). If the proxy rewrites the host, set `serverActions.allowedOrigins`.

A Sanity outage at build time fails the build loudly; at runtime the cached pages keep being served.

## Security and privacy

- CSP on every response: a static policy for prerendered public pages (`script-src 'self' 'unsafe-inline'`, no third-party origins) and a per-request nonce policy for the admin; HSTS, `nosniff`, `X-Frame-Options: DENY`, COOP/CORP `same-origin`, a restrictive `Permissions-Policy` (D4, D56).
- Server-only modules import `server-only`; `check:bundle` fails if a server-only variable's name or value reaches the client.
- Zod validation at every boundary, sanitized Markdown, URL allowlists, SVG and PDF sanitizers, EXIF stripping (D54).
- No analytics or visitor cookies beyond the functional `NEXT_LOCALE`, set only on an explicit language switch.

## CI

GitHub Actions (`.github/workflows/ci.yml`) on pull requests and pushes to `main` and `next`: frozen install, format, lint, typecheck, unit tests, i18n and icon audits, build, `check:bundle`, `check:seo`, Playwright (Chromium, WebKit, mobile, Firefox smoke, visual), Lighthouse CI with reports as artifacts, and `bun audit` in a separate job. Dependabot opens grouped weekly updates. `Visual baselines` is a manual workflow that regenerates the screenshot baselines.

## Documentation

- [docs/SPEC.md](docs/SPEC.md): the product and engineering specification.
- [docs/DECISIONS.md](docs/DECISIONS.md): architecture, resolved versions and every decision (D1–D61), contradictions and risks.
- [docs/ADDING_CONTENT.md](docs/ADDING_CONTENT.md): editing guide and what the owner still has to supply.
- [docs/ADMIN.md](docs/ADMIN.md): secret commands, password and session setup, security notes.
- [docs/SANITY.md](docs/SANITY.md): project, datasets, tokens, webhook, seeding, smoke runs.
- [docs/SEO.md](docs/SEO.md): what is emitted, how it is verified, launch checklist.
- [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md): automated coverage and the manual screen-reader checklist.

## Known limitations

- Performance, LCP and TBT are enforced at regression floors, not at the §16 targets; initial JS is ~191 KB gzip against a 150 KB goal (D58, D60).
- The login rate limiter is per instance (in memory) and trusts `X-Forwarded-For`.
- PDF scanning does not inspect compressed object streams.
- The admin's unsaved-changes guard cannot intercept the browser's Back button.
