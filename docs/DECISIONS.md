# Decisions

Phase 0 output. Format per decision: **context → decision → consequence**. Later phases append new entries; superseded entries are marked, never deleted.

Resolved on 2026-10-13 against the npm registry and the docs bundled inside the published packages (`next/dist/docs`, `next-intl` types).

## 1. Repository facts

- Repo `juliolmuller/juliolmuller.github.io`, branch `next`, working tree empty (previous site cleared in `3637e7b`).
- Local toolchain: Node 24.19.0 (current LTS line "Krypton"; latest 24.21.0), Bun 1.4.3 (D24; pnpm 12.8.1 until then).

## 2. Resolved versions

Latest stable unless noted. Majors are pinned with `^`; exact versions come from the lockfile.

| Package                                          | Version               | Note                                                                                                 |
| ------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------- |
| Node                                             | 24 LTS                | `.nvmrc` = `24`, `engines.node` = `>=24.11 <25`                                                      |
| Bun                                              | 1.4.x                 | Package manager and runtime, `packageManager` = `bun@1.4.3`, Vercel `bunVersion` = `1.4.x` (D24)     |
| next / eslint-config-next                        | 16.4.0                | App Router, `proxy.ts`, Turbopack default                                                            |
| react / react-dom                                | 19.3.x                |                                                                                                      |
| typescript                                       | **6.0.x** (not 7.0.2) | D5                                                                                                   |
| eslint                                           | **9.39.x** (not 10.x) | D6                                                                                                   |
| typescript-eslint                                | 8.71.x                | peer: TS `<6.1`                                                                                      |
| eslint-plugin-jsx-a11y                           | 6.10.2                | peer: ESLint `<=9`                                                                                   |
| tailwindcss / @tailwindcss/postcss               | 4.3.x                 | CSS-first `@theme`, no JS config                                                                     |
| next-intl                                        | 4.14.x                | D2                                                                                                   |
| motion                                           | 14.1.x                | `motion/react`, `LazyMotion` + `domAnimation`                                                        |
| zustand                                          | 5.0.x                 |                                                                                                      |
| @sanity/client                                   | 8.9.x                 | D7 (no `next-sanity`)                                                                                |
| @sanity/image-url                                | 2.1.x                 |                                                                                                      |
| zod                                              | 4.6.x                 |                                                                                                      |
| sharp                                            | 0.35.x                |                                                                                                      |
| jose                                             | 6.2.x                 |                                                                                                      |
| react-markdown / remark-gfm / rehype-sanitize    | 10.1 / 4.0 / 6.0      |                                                                                                      |
| simple-icons                                     | 16.35.x               | D13                                                                                                  |
| @iconify-json/devicon                            | 1.2.x                 | D13                                                                                                  |
| lucide-react                                     | 1.55.x                |                                                                                                      |
| vitest                                           | 5.0.x                 | jsdom env for component tests                                                                        |
| @playwright/test / @axe-core/playwright          | 1.64 / 4.13           |                                                                                                      |
| prettier / prettier-plugin-tailwindcss           | 3.9 / 0.8             |                                                                                                      |
| schema-dts / html-validate                       | 2.1 / 11.16           |                                                                                                      |
| class-variance-authority / tailwind-merge / clsx | 0.7 / 3.7 / latest    |                                                                                                      |
| @upstash/redis                                   | 1.39.x                | optional rate-limit adapter                                                                          |
| husky / lint-staged                              | 9.1 / 17.6            |                                                                                                      |
| geist                                            | 1.7.x                 | via `next/font/local` from the package; JetBrains Mono via `next/font/google` (self-hosted at build) |

## 3. Architecture summary

- **Rendering.** All public routes under `src/app/[locale]` are prerendered at build (`generateStaticParams` for locales and known slugs) with classic ISR (24 h `revalidate`, `fetch` tags; see D1b, which supersedes the original Cache Components plan). Unknown slugs render blocking on request and are cached afterwards. The admin tree (`src/app/admin`) is fully dynamic (reads cookies), `no-store`, nonce-CSP.
- **Data.** `ContentRepository` interface → `sanity` adapter (GROQ over `@sanity/client`, server-only, every read wrapped in a `'use cache'` function tagged `content:*`) and `fixtures` adapter (in-memory, writable outside production). zod schemas in `src/lib/content/schema.ts` are the single contract; types are `z.infer`. Locale resolution happens inside the repository, never in components.
- **Request interception.** One `src/proxy.ts` (Node runtime, the v16 default) with three jobs, in order: (1) canonicalization (lowercase → 308); (2) admin gate for `/admin/:path*` (JWT verify with `jose`; failure → rewrite to the global 404); (3) locale negotiation for `/` only, delegated to next-intl's middleware. Admin nonce CSP is generated here.
- **Client islands.** Header scroll state, nav indicator, mobile menu, language switcher enhancement, motion-pause toggle, reveal wrapper, counters, card spotlight, filter animation, tech sphere (lazy), window manager + terminal (lazy, mounted in `[locale]/layout.tsx`), lightbox (lazy). Everything else is RSC.
- **Terminal.** Pure TS core in `src/lib/terminal` (parser, VFS, registry, completion, history, output AST), React shell in `src/components/terminal`, content from `/api/terminal-content`. Secret commands are a separate dynamic-import chunk; names in `secret/names.ts` only.
- **Auth.** Single admin; scrypt hash or HMAC'd plaintext compare; HS256 JWT in `__Host-jm_session`; rate limiter interface (memory default, Upstash optional); `requireAdmin()` in every admin RSC, Route Handler and Server Action.
- **Hosting.** Vercel (Node runtime). See D11.

## 4. Decisions

### D1 — Caching model: Cache Components, with a verified fallback

- **Context.** Next 16 stabilized `cacheComponents` (`'use cache'`, `cacheTag`, `cacheLife`, PPR by default). Its docs say it becomes the only model in the next major. Route segment configs `revalidate`, `dynamic` and `dynamicParams` are rejected when it is on. The spec asks for static prerendering + tag ISR, `dynamicParams` on, a real HTTP 404 for unknown slugs and a real 308 for `previousSlugs`.
- **Decision.** Enable `cacheComponents: true` and `partialPrefetching: true`. Repository reads are `'use cache'` functions with `cacheTag(...)` and `cacheLife('content')` (custom profile: `revalidate: 86400`). `dynamicParams` is not exported; the v16 default (unknown params render on request) is equivalent to "on". The project page awaits its data at the top level (outside any `Suspense`) so `notFound()` / `permanentRedirect()` run before the shell is flushed.
- **Consequence.** A Phase 1 spike MUST prove, against `next build && next start`, that an unknown slug returns status 404 (not a streamed 200) and a previous slug returns 308 with a `Location` header. If either fails, switch to the classic model (`cacheComponents` off, `fetch` tags / `unstable_cache`, `revalidate = 86400`, `dynamicParams = true`) and record a superseding decision. No other code depends on which model wins because caching is confined to the repository adapters and route files.

### D1b — Caching model: classic ISR (supersedes D1)

- **Context.** The Phase 1 test on `next build && next start` with Cache Components gave `200` for an unknown slug (the 404 UI was streamed under the fallback shell) and `200` plus a client-side redirect for a previous slug. The installed docs confirm it (`loading.md` → "Status codes": streamed responses always start with `200`) and suggest validating slugs in the proxy instead, which would need a slug index fetched by the proxy on every project request. The same applies to `?page=` beyond the last page.
- **Decision.** `cacheComponents` stays off. Routes use segment config: `revalidate = 86400` as the stale-content fallback, `dynamicParams = true` on `projects/[slug]`, `generateStaticParams` for locales and known slugs. Sanity reads go through a small typed GROQ-over-HTTP helper using `fetch` with `next: { tags }` (`@sanity/client` 8 has no Next fetch integration; it is kept for writes and asset uploads). `unstable_cache` is not used (marked as replaced in v16). The fixtures adapter has no fetch, so admin writes call `updateTag` for Sanity tags **and** `revalidatePath` for the affected routes.
- **Verified.** With this setup the production server answers `/en/projects/nope` → `404`, `/en/projects/old-alpha` → `308 Location: /en/projects/alpha`, and `/en`, `/pt` and known slugs are prerendered (`●`).
- **Consequence.** Migrating to Cache Components later (it becomes mandatory in the next major) needs the proxy slug check; caching is confined to the repository adapters and route segment configs, so the change stays contained. `next/root-params` works without Cache Components.

### D2 — next-intl: root params instead of `setRequestLocale`

- **Context.** The spec says to call `setRequestLocale` in every layout/page. In next-intl 4.14 the `setRequestLocale` cache is marked `@deprecated` in favor of `next/root-params`, which is what keeps routes static under Cache Components.
- **Decision.** `[locale]` is the root segment of the public tree (own root layout with `<html lang>`); `src/i18n/request.ts` reads the locale through `next/root-params`. `setRequestLocale` is not used. Typed messages via `AppConfig` module augmentation (`Messages`, `Locale`).
- **Consequence.** Two root layouts (`[locale]/layout.tsx` and `admin/layout.tsx`) instead of one shared `app/layout.tsx`; a global `app/not-found.tsx` with its own `<html>` serves non-localized 404s (D3). Same intent as the spec, current API.

### D3 — URL policy and the indistinguishable 404

- **Context.** next-intl's default middleware redirects every unprefixed path (`/foo` → `/en/foo`). The spec says only `/` negotiates and that anonymous `/admin/**` must be byte-for-byte the same 404 as any non-existent path.
- **Decision.** The proxy invokes next-intl only for `/` (307, cookie → `Accept-Language` → `en`). Any other unprefixed path is a real 404 served by the global `app/not-found.tsx` (English, terminal-flavored). Anonymous `/admin/**` (GET, POST, Server Action posts, `/admin/api/upload`) is rewritten to an internal path that does not exist, so Next renders that same global 404 with status 404. Admin responses never set distinguishing headers before the session check passes (the `X-Robots-Tag` set applies to the 404 as well, since every 404 carries `noindex` anyway).
- **Consequence.** `/random` and `/admin` produce identical HTML, status and headers; an e2e test diffs them (ignoring `Date`). Localized 404s still exist under `/{locale}/...`. Trailing-slash 308 stays Next's default; lowercase 308 lives in the proxy.

### D4 — CSP: static-friendly policy for public pages, nonce for admin

- **Context.** Nonces require dynamic rendering for every page (Next docs, "Static vs Dynamic Rendering with CSP") and are incompatible with PPR. Experimental SRI (`experimental.sri`) adds `integrity` to external chunks but does not cover the inline RSC flight scripts (`self.__next_f.push(...)`) that every App Router page emits; those differ per page and per revalidation, so build-time hashes are impossible under ISR.
- **Decision.**
  - Public routes (`next.config.ts` `headers()`): `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests`. (SRI was planned here and dropped in D56.) `'unsafe-eval'` in development only.
  - Admin routes (proxy): `script-src 'self' 'nonce-…' 'strict-dynamic'`, `style-src 'self' 'nonce-…'` + `style-src-attr 'unsafe-inline'`, otherwise identical.
- **Consequence.** The public policy deviates from "no blanket `unsafe-inline`" for scripts. Mitigation: zero third-party origins (`connect-src`/`script-src` are `'self'` only, so injected script cannot exfiltrate or load remote code), no user-generated HTML, sanitized Markdown, JSON-LD serializer escapes `<`. Revisit when Next ships hash support for inline flight data. `style-src-attr 'unsafe-inline'` is needed by Motion and `next/image` placeholders; verified in Phase 9.

### D5 — TypeScript 6.0, not 7.0

- **Context.** `typescript@latest` is 7.0.2; `typescript-eslint@8.71` peers on `typescript >=4.8.4 <6.1.0`, and `eslint-config-next` depends on it.
- **Decision.** Pin `typescript@~6.0.3`.
- **Consequence.** Revisit when typescript-eslint supports 7.x (Renovate will flag it).

### D6 — ESLint 9, not 10

- **Context.** `eslint@latest` is 10.12; `eslint-plugin-jsx-a11y@6.10.2` peers on ESLint `^3 … ^9`. jsx-a11y strict is a spec requirement.
- **Decision.** Pin `eslint@^9.39`, flat config.
- **Consequence.** Revisit when jsx-a11y supports 10.

### D7 — `@sanity/client` directly, no `next-sanity`

- **Context.** `next-sanity@13` peers on `sanity` (Studio) and `styled-components`; its value is Studio embedding, Live Content and Visual Editing, all out of scope. Caching is handled by Next (D1), not by the client.
- **Decision.** `@sanity/client` + `@sanity/image-url` + GROQ strings typed by zod output.
- **Consequence.** Smaller server bundle, no Studio deps. Live preview is not available (not required: admin saves publish immediately).

### D8 — Sanity client settings

- **Context.** Private dataset, token-authenticated reads, Next is the cache layer.
- **Decision.** Read client: `useCdn: false`, `perspective: 'published'`, `apiVersion` from `SANITY_API_VERSION` (default `2026-10-01`), `token: SANITY_READ_TOKEN`. Write client: `useCdn: false`, `SANITY_WRITE_TOKEN`. Both constructed in `server-only` modules.
- **Consequence.** Every cache miss hits the live API (a cold build issues one query per page type, not per field). Cost is negligible at this traffic; freshness after writes is guaranteed.

### D9 — Revalidation APIs

- **Context.** In v16 `revalidateTag(tag)` without a profile is deprecated; `updateTag(tag)` gives read-your-writes and is Server-Action-only.
- **Decision.** Admin Server Actions call `updateTag(...)` for every affected tag (plus `revalidatePath('/sitemap.xml')` when slugs or visibility change). The webhook Route Handler calls `revalidateTag(tag, { expire: 0 })`. "Revalidate all" calls `updateTag` for every `content:*` tag.
- **Consequence.** The editor sees the change on the next navigation; visitors get fresh pages on their next request.

### D10 — Upload transport and body limits

- **Context.** Server Actions default to a 1 MB body; uploads are up to 10 MB.
- **Decision.** Files go only through `POST /admin/api/upload` (Route Handler, streamed `request.formData()` with a manual size check before parsing large parts) returning an asset reference; forms then submit the reference to a Server Action. `serverActions.bodySizeLimit` stays at `1mb` explicitly; the Route Handler enforces 8 MB / 10 MB itself and the proxy rejects `Content-Length` above 11 MB on that path.
- **Consequence.** Server Actions never carry binaries. Vercel's own request limit (4.5 MB on serverless functions) is below 8–10 MB: recorded as risk R3.

### D11 — Hosting: Vercel, not GitHub Pages

- **Context.** The repo name suggests GitHub Pages, which only serves static files. The spec needs a proxy, Server Actions, Route Handlers and on-demand revalidation.
- **Decision.** Deploy on Vercel (Node runtime, Fluid compute). The repo name can stay; the custom domain points at Vercel.
- **Consequence.** Any GitHub Pages workflow/CNAME setup from the old site must be removed when the domain moves.

### D12 — `text-3` token raised from `#7a8196` to `#828a9f`

- **Context.** Measured contrast: `text-3` is 5.16:1 on `bg-0` but **4.44:1 on `surface-2`** (chips, raised surfaces), failing AA. All other text tokens pass on every surface (`text-1` ≥ 14.3, `text-2` ≥ 7.3, accents ≥ 5.3).
- **Decision.** `--color-text-3: #828a9f` (4.99:1 on `surface-2`, ~5.8:1 on `bg-0`). Visual difference is marginal.
- **Consequence.** The contrast unit test covers every fg token × every surface token and fails below 4.5:1 (body pairs `text-1`/`text-2` on `bg-0` must reach 7:1).

### D13 — Technology icon resolution (audited, not assumed)

- **Context.** Checked every Appendix C item against simple-icons 16.35 and devicon 1.2.71.
- **Decision.** Simple Icons first, Devicon second, monogram last:
  - Devicon fallback: Java (`java`; Simple Icons only has `openjdk`, a different mark), AWS (`amazonwebservices`), Zustand, gRPC, AngularJS (`angularjs`; the Simple Icons `angular` mark is modern Angular, wrong brand), VBA (`visualbasic`, closest legitimate mark; otherwise monogram as the spec expects).
  - Simple Icons: TanStack Query → `reactquery`; Swagger / OpenAPI → `swagger`; Pub/Sub → `googlepubsub`; BigQuery → `googlebigquery`; everything else under its obvious slug.
  - Monogram: SQL (no vendor-neutral mark; `mysql`/`sqlite` would be misleading), Excel / Power Query, Power BI, SharePoint (absent from both sets).
- **Consequence.** Devicon marks are multi-color; they render as `currentColor` single-tone paths, so `icons:audit` also writes a contact sheet (`.cache/icons-audit.html`) for visual review in Phase 2. Any illegible devicon mark falls back to the monogram.
- **Update (Phase 2, audited).** `devicon` resolves through `@iconify-json/devicon-plain` (single-tone, MIT) first and the multicolor set second, converting only plain `path`/`circle`/`ellipse`/`rect`/`polygon` geometry; anything with gradients, transforms, strokes or `evenodd` is rejected. Result: 36 Simple Icons, 5 devicon-plain (Java, Zustand, AngularJS, gRPC, AWS), 5 monograms. VBA is a monogram after all: the `visualbasic` mark is VB.NET's. Monograms can be pinned with the `monogram` field (Excel / Power Query → `XL`, Power BI → `BI`). Dark brand colors (Next.js, Express, Fastify, Prisma, GitHub, Lua) need the Phase 4 luminance correction.

### D14 — Fixture images and PDFs are generated and committed

- **Context.** The spec asks for a deterministic `sharp` generator. Running it at build would make builds depend on generation time and native deps.
- **Decision.** `scripts/generate-fixtures.ts` (deterministic, seeded by slug) writes to `fixtures/images` and `fixtures/pdf`; outputs are committed (WebP/AVIF sized for 1600×1000; ~2–3 MB total). The PDF is a hand-built minimal PDF (no JS, no external fonts), no extra dependency.
- **Consequence.** `fixtures` adapter serves them via a static route; the seed script uploads the same files.
- **Update (Phase 2).** Outputs go to `public/fixtures/{images,pdf}` (Next serves them; `images.localPatterns` allows `/fixtures/images/**`, the proxy passes `/fixtures` through) plus a manifest, `src/lib/content/fixtures/assets.generated.ts` (dimensions, 20 px LQIP data URL, byte sizes). WebP q82 only, since `next/image` produces AVIF on demand: 13 images + 2 PDFs = 129 KB. Regenerate with `bun run fixtures:generate`; output is byte-stable.
- **Update (D47).** Authored keys (`profile-photo`, `profile-photo-lg`) encode from committed jpg/png masters and are never SVG-regenerated.

### D15 — Dependency build scripts allowlist

- ~~**Decision.** `pnpm-workspace.yaml` `onlyBuiltDependencies: [...]`.~~ Superseded by D24.
- **Decision (D24).** `package.json` `trustedDependencies: []`. Bun blocks lifecycle scripts by default; the three it blocks (`@parcel/watcher`, `@swc/core`, `unrs-resolver`) are build-from-source fallbacks whose prebuilt binaries ship as optional dependencies. Add an entry only when a package fails without its script.

### D16 — View Transitions deferred

- **Context.** Next 16 documents React `<ViewTransition>`; it depends on React canary/experimental features at the time of writing.
- **Decision.** Phase 3 ships a CSS cross-fade between routes. The card → detail morph is Phase 10 and only if `<ViewTransition>` is available in stable React 19.3 without experimental flags. (Done in Phase 10: React 19.3 ships `<ViewTransition>` stable, see D62.)

### D17 — Smaller interpretations

- **Primary button** "solid `text-1` on `bg-0`" is read as background `text-1` with label `bg-0` (inverted, 16.6:1).
- **Skip link** text: "Skip to main content" (§14.1 wins over §3.2's "Skip to content").
- **Experience slugs** for the VFS (`experience/<company-slug>.md`) are derived from `company` with a deterministic slugify; collisions get a numeric suffix.
- **Session cookie** in development is `jm_session` (no `Secure`, `__Host-` requires it).
- **Rate limiting on Vercel**: the in-memory limiter is per instance; production SHOULD set the Upstash vars. `docs/ADMIN.md` documents this.
- **Admin `lang`**: `admin/layout.tsx` is a root layout with `<html lang="en">`.
- **`/dev/ui`**: lives at `src/app/dev/ui/page.tsx`, calls `notFound()` when `NODE_ENV === 'production'`, excluded from the sitemap; it is also outside `[locale]`, so it follows the D3 rule in production (404).

### D18 — Locale negotiation written in the proxy, not next-intl's middleware

- **Context.** next-intl's middleware manages the `NEXT_LOCALE` cookie by its own rules and redirects every unprefixed path. The spec wants the cookie written only on an explicit switch and negotiation only on `/`.
- **Decision.** `src/i18n/negotiate.ts` (pure, unit-tested: cookie → `Accept-Language` with q-values → `en`) is called by `src/proxy.ts` for `/` only (307, `Vary: Accept-Language, Cookie`, `Cache-Control: private, no-store`). next-intl routing sets `localeCookie: false`, `localeDetection: false`. The language switcher writes the cookie on click.
- **Consequence.** Without JavaScript the switch still works (plain links) but no preference is saved; the next visit to `/` falls back to `Accept-Language`.

### D19 — The global 404 is `global-not-found.tsx` (experimental flag)

- **Context.** The public root layout is `[locale]/layout.tsx` and the admin has its own root layout, so there is no single layout to build a shared 404 from; the installed docs recommend `global-not-found.js` for exactly this case.
- **Decision.** `experimental.globalNotFound: true`. The proxy rewrites every path whose first segment is not a locale or a known root file (including anonymous `/admin/**`) to `/404`, which the router cannot match. `[locale]/[...rest]/page.tsx` calls `notFound()` so `/en/unknown` gets the localized 404 with status 404.
- **Verified.** `/random`, `/admin`, `POST /admin`, `/admin/api/upload` and `/foo.php` all return `404` with the same body.

### D20 — Prettier preferences

- **Decision.** Taken from the owner's editor settings: `singleQuote`, `trailingComma: all`, `printWidth: 80`, semicolons, 2 spaces, plus the Tailwind plugin. `endOfLine` is `lf` (the editor default is `crlf`, but the repo lives in WSL/Linux and CI runs on Linux); `.gitattributes` enforces it.

### D21 — Inline motion-init script

- **Context.** A persisted "Pause animations" choice must apply before first paint, or the hero animates for a frame. The spec allows `dangerouslySetInnerHTML` only for JSON-LD. React 19.3 rejects `<script>` tags created while any React component (including `next/script`) is rendering on the client — they never execute, and Next 16.4 can 500 with "element type is invalid … got: undefined".
- **Decision.** One constant, dependency-free IIFE (`src/lib/motion-init.ts`) injected into `<head>` with `useServerInsertedHTML` from a client leaf that returns `null` (`src/components/layout/motion-init.tsx`). Next splices it into the SSR stream before `</head>`, so it runs during HTML parse and is not in the client tree. It contains no interpolated user or content data. `<html>` uses `suppressHydrationWarning` for `data-motion`.
- **Consequence.** Second, documented exception to the `dangerouslySetInnerHTML` rule; covered by the public CSP's `script-src 'unsafe-inline'` (D4). Neither a raw `<script>` nor `next/script` `beforeInteractive` can live in the locale layout's JSX under React 19.3.

### D22 — Nav indicator without Motion `layoutId`

- **Context.** `layoutId` requires Motion's `domMax` feature bundle (~10 KB gzip more than `domAnimation`), against the 150 KB initial-JS budget.
- **Decision.** The indicator is an absolutely positioned pill whose `transform` and `width` are set from the active link's box and animated with a CSS transition (`--ease-out-expo`). Motion stays lazy (`LazyMotion` + async `domAnimation`).
- **Consequence.** Same visual result; Motion layout animations remain available for the portfolio filter (loaded only on `/projects`).

### D23 — axe runs on Chromium projects

- **Context.** `@axe-core/playwright` hangs inside WebKit's `page.evaluate` in this environment (timeouts, no violations reported).
- **Decision.** axe checks run on the desktop Chromium and mobile (Pixel 7, Chromium) projects; WebKit runs every functional test. axe rules evaluate the DOM and are engine-agnostic.
- **Addendum.** axe scans of animated UI (the mobile menu) wait for `getAnimations({ subtree: true })` to finish first; otherwise contrast is sampled mid fade-in and the test flakes.

### D24 — Bun 1.4 as package manager and Vercel runtime

- **Context.** Owner request: replace pnpm with Bun and pin Bun 1.4 on Vercel. Vercel's `bunVersion` accepts `"1.4.x"` or `"1.x"` (resolves to 1.3.x); setting it switches Vercel Functions to the Bun runtime (beta). For Next.js with ISR, Vercel requires `next dev/build/start` to run under `bun run --bun`.
- **Decision.**
  - `vercel.json`: `"bunVersion": "1.4.x"`, `installCommand: bun install --frozen-lockfile`. `packageManager: bun@1.4.3`, `engines.bun: >=1.4.0 <1.5.0`, `bun.lock` committed.
  - `dev`/`build`/`start` use `bun run --bun next …`. Repo scripts run as `bun --conditions=react-server scripts/<name>.ts` (resolves `server-only` to its no-op export; `tsx` dropped).
  - Node 24 stays for tooling that spawns `node` through shebangs: ESLint, Vitest, Playwright. `.nvmrc` and `engines.node` are kept, and CI installs both.
  - `audit:deps` = `bun audit --audit-level=high --ignore=GHSA-vfj7-8cjw-p6xm`. That advisory (`braces` ≤ 3.0.3, ReDoS-style stack exhaustion) has no patched release and only reaches the tree through `eslint-config-next` → `fast-glob` (dev-only, never fed untrusted patterns). Remove the ignore when a fix ships.
- **Consequence.** The proxy is expected to stay on Node (Next 16 proxies cannot set `runtime`; unconfirmed how Vercel maps it under `bunVersion`), so production likely mixes the Bun function runtime for pages and route handlers with Node for the proxy. Verified locally under Bun 1.4.3: lint, typecheck, 43 unit tests, build (`/en`, `/pt` ●), e2e 38 passed / 4 skipped. **Risk (speculative):** the Bun runtime is beta on Vercel; if ISR revalidation or `sharp` misbehaves there, remove `bunVersion` (Bun remains the package manager) and record it here.

### D25 — One content pipeline, two thin sources

- **Context.** Two adapters must pass the same contract (§11.1) and handle invalid, hidden and untranslated documents identically.
- **Decision.** Adapters implement `ContentSource` and only fetch raw documents in schema field names (`fixtures` clones memory; `sanity` runs GROQ projections that rename storage fields). `createRepository(source, logger)` owns the shared pipeline: strip nulls → fill an empty `pt` from `en` (warn `missing-translation`) → strict zod parse, skipping invalid documents (warn `invalid-document` with paths and codes, never values) → visibility filter → sort by `order`, then `id` → drop duplicate slugs → drop hidden or unknown technology references → resolve the locale and icons.
- **Consequence.** Behavior can't diverge between adapters, and a test asserts deep equality of every repository method across both. A technology edit invalidates `content:technologies` only, because every read that filters technology references also carries that tag.

### D26 — Sanity reads over plain `fetch` (amends D8)

- **Context.** ISR needs Next's fetch cache with `next.tags`; authorized requests are only cached with an explicit `cache: 'force-cache'` (fetch API reference). Routing the client's request layer through Next's patched `fetch` is an implementation detail, not a contract.
- **Decision.** `src/lib/content/sanity/http.ts` (server-only) calls `GET https://<projectId>.api.sanity.io/v<apiVersion>/data/query/<dataset>` with `perspective=published`, `returnQuery=false`, the Viewer token as a Bearer header, `cache: 'force-cache'`, `next: { revalidate: 86400, tags }`. No CDN (D8 unchanged). `@sanity/client` stays for writes and the seed. Errors carry the HTTP status only.
- **Consequence.** Cache behavior is explicit and testable, and there is no client instance on the read path. Long GROQ queries go in the URL (≤ 1.5 KB URL-encoded today; Sanity asks for POST above 11 KB).

### D27 — The Sanity adapter is contract-tested offline with groq-js

- **Context.** CI has no Sanity credentials, and mocking query results would only test the mocks.
- **Decision.** `tests/support/sanity-memory.ts` converts the fixture dataset into Sanity storage documents (the converter is the seed's own code, `sanity/documents.ts`), synthesizes `sanity.imageAsset`/`sanity.fileAsset` documents, and evaluates the adapter's real GROQ with `groq-js`. `groq-js` is banned outside `src/lib/content` and `scripts` by ESLint.
- **Consequence.** Queries, projections, dereferences and tag wiring are exercised in CI. Remaining gap: `groq-js` vs the hosted engine. This is covered by the live smoke test after seeding (`docs/SANITY.md`).

### D28 — Sanity storage shape and ids

- **Context.** The schema is zod-first. Sanity also needs typed objects, keyed arrays and references.
- **Decision.** Localized fields are `localeString` / `localeText` / `localeMarkdown` objects `{ en, pt }`. Array items get stable `_key`s (sha1 of the path). Technologies are reference arrays, images are `image` objects with a localized `alt` and `hotspot` (focal point), and slugs are `{ current }`. Singletons use their type as `_id` (`profile`, `contact`, `resume`); seeded collection documents use `<type>.<uuid-like sha1(type:key)>`, so re-seeding is idempotent. Documents created later by the admin use plain UUIDs; nothing depends on the id format.
- **Consequence.** Ids with a dot are "path" ids that the public API hides; the dataset is private and every read is authenticated, so this is moot. Confirmed on `development` (2026-10-13): the published perspective returns all 86 seeded documents with a Viewer token.

### D29 — Studio schema as plain data, deployed through MCP (amends §11.10)

- **Context.** §11.10 asks for `sanity/schema/*.ts` with `defineType`. That requires the `sanity` package (Studio, React peers, styled-components) only to type-check data the app never runs.
- **Decision.** One plain-data file, `sanity/schema.ts` (`schemaTypes`: 6 object types, 10 document types), mirrors the storage shape, with no `sanity` dependency. The same declaration is deployed to both datasets as the `default` workspace schema, so Sanity's tooling (Content Lake schema, MCP, a future Studio) knows the types; `bun run sanity:schema` prints it. Validation stays in zod. A unit test walks every converted fixture document and fails if a field is missing from the schema.
- **Consequence.** A separate Studio can later `import { schemaTypes }` into `defineConfig` unchanged. Schema changes mean: edit `sanity/schema.ts` → test → redeploy (`docs/SANITY.md`). (Phase 10 adds the Studio layer in `sanity/studio.ts`, D65.)

### D30 — Datasets and seeding

- **Context.** Seed data is fictional and must never be mistaken for real content (data policy). Hidden items must not be publicly readable (§11.2).
- **Decision.** Project `njcnsmax` has two private datasets: `production` (real content, entered through the admin) and `development` (fictional seed, the default for local work and previews). `bun run sanity:seed` writes with `createOrReplace` in one transaction, uploads assets (Sanity deduplicates by hash, and only `lqip` metadata is extracted), refuses `production` without `--force`, and `--reset` deletes only `isFixture == true` documents after the dataset name is typed on a TTY. `--dry-run` converts without network writes.
- **Consequence.** Seeding is repeatable and can't touch real documents. Production stays empty until Phase 8 unless someone forces it.

### D31 — Open Graph images via `next/og`

- **Context.** §13.8 wants a 1200×630 dark template per page and locale, with fonts and a photo when available.
- **Decision.** One renderer (`src/lib/seo/og-image.tsx`) uses `ImageResponse` and Geist TTF from the `geist` package (Satori does not read `woff2`). Each public segment has `opengraph-image.tsx` and a `twitter-image.tsx` that re-exports it. Local fixture photos are read from `public/`; Sanity photos are fetched from their absolute URL.
- **Consequence.** Social previews stay on-origin and prerender with the page. A unit test asserts the response is a PNG.

### D32 — `check:seo` starts its own server

- **Context.** §13.10 wants the checker to run against the production build with JavaScript disabled.
- **Decision.** `scripts/check-seo.ts` starts `next start` on `SEO_PORT` (default 3101) unless `SEO_BASE_URL` is set. Canonicals are asserted against `NEXT_PUBLIC_SITE_URL`, not the fetch host, so CI can keep `SITE_URL` on 3100 while the checker uses 3101. Admin session checks wait for Phase 7; anonymous `/admin` is already covered by the 404 e2e.
- **Consequence.** CI can run `check:seo` after `build` without sharing Playwright's port.

### D33 — Invalid project query params are 404s

- **Context.** D1b requires a real 404 for `?page=` past the last page. An unknown `?kind=` is the same class of problem.
- **Decision.** `parseProjectsQuery` rejects unknown kinds and non-positive pages. The index also 404s when the kind has no visible projects or the page is past `totalPages`.
- **Consequence.** Soft-404 filtered URLs never enter the index.

### D34 — Project filter has no Motion layout animation

- **Context.** §8.4 asks for Motion `layout` + `AnimatePresence` on the filter reflow. Putting the grid in a client component would force `ProjectCard` (and `next/image`) across the client boundary.
- **Decision.** The filter is crawlable links; selecting a kind is a navigation, so the new grid is server-rendered. Cards stay Server Components wrapping the existing `Tilt` island. The live region still announces the count.
- **Consequence.** No-JS and RSC stay the default. A client reflow can be added later without changing the URLs.

### D35 — Projects index is dynamic

- **Context.** Awaiting `searchParams` for `?kind=` / `?page=` makes the segment dynamic in Next 16, so `/[locale]/projects` is `ƒ` in the build output while Home, accessibility and known slugs stay `●`.
- **Decision.** Leave it request-rendered (`revalidate = 86400`). The unfiltered HTML is still complete in the first response. Forcing `force-static` would drop the query.
- **Consequence.** First hit after a deploy pays a server render; later hits are cached for 24 h.

### D36 — axe ignores pending reveals; Playwright serializes under load

- **Context.** Below-fold `Reveal` nodes get `data-reveal=pending` (opacity 0) after hydration. axe then reports contrast against the page background. Hiding them with `visibility: hidden` made full-page screenshots empty.
- **Decision.** Leave pending reveals at `opacity: 0` only. axe calls `.exclude('[data-reveal=pending]')`. Screenshot tests emulate `prefers-reduced-motion` so every section stays visible. Playwright uses 2 workers, a 60 s test timeout, and `force` clicks plus `domcontentloaded` on the WebKit language/motion tests — looping hero motion never settles WebKit's actionability check.
- **Consequence.** Contrast is audited on painted content. WebKit still runs the functional assertions; axe stays Chromium-only (D23).

### D37 — Tech cloud follows the `techs-cloud` prototype

- **Context.** Phase 4 was about to implement §7 as written (monochrome `currentColor` Fibonacci sphere, 46 Appendix C items, pitch+yaw, global pause on hover). The owner pointed at `~/techs-cloud/index.html` ([juliolmuller/techs-cloud](https://github.com/juliolmuller/techs-cloud)) as the look and the inventory. That page is vanilla DOM + rAF, no WebGL.
- **What the prototype actually does.**
  - Fibonacci / golden-ratio points, then a **geoid**: each item gets `radiusMultiplier ∈ [0.8, 1.2]`, a latitude-based spin (`faster toward the poles`), and a 6px sine float.
  - Projection is 2D (`translate` + `scale` + `opacity` + `z-index`). Back hemisphere (`z ≤ 0`) has `pointer-events: none`.
  - Auto-rotate never stops. Hover slows **that** icon to 0.05×, blurs it, and crossfades its name on top of the mark. No tooltip chrome, no category chips, no list view.
  - Drag is **yaw only** (mouse X / touch X) with inverted delta and 0.95 inertia. No pitch. Touch is `passive` and does not reserve vertical page scroll.
  - Marks are full-color `<img>` from jsDelivr Devicon / SVGL / Simple Icons. Dark marks (`invert: true`) get `filter: invert(1) brightness(2)`. Radial CSS mask fades the rim.
  - 85 names, shuffled once per load. Always-on rAF. No reduced motion.
- **Decision.** Port the **feel and the set**, not the runtime.
  - **Feel:** geoid radii, latitude speeds, float, radial mask, yaw-only drag + inertia, per-item hover slowdown, name-on-icon (blur the mark). Icon box 32px (28px under 640px). Soft orbit glow stays. Stage width is the display (D38), not `min(720px, 100%)`.
  - **Set:** seed the 85 prototype names, then **re-add every Appendix C item that still resolves** in Simple Icons or Devicon (Redis, RabbitMQ, Pub/Sub, BigQuery, SAP, Zustand, TanStack Query, VBA via `visualbasic`). SVGL was checked for the rest: Excel and SharePoint exist but are radial-gradient meshes; VS Code is mask + evenodd; OpenAI/GPT is evenodd-only and Simple Icons has no `openai` slug; Power BI is in neither Devicon nor SVGL. Those five stay monograms. Lovable resolves via `devicon-plain`. Appendix C’s “do not seed React Native / Electron” is revoked — they are in the prototype. Admin can hide/add later. Practices stay List-view chips.
  - **Cannot copy:** CDN `<img>` (no third-party browser requests). Resolve on the server into sanitized inline SVG, **keeping brand fills** for the cloud (amends D13 for this surface only). Dark marks use the prototype invert list, not the §7 luminance→`text-1` swap. List view can stay single-tone `TechIcon` so the grouped `<ul>` does not turn into a sticker sheet.
  - **Keep from §7:** Cloud | List control; List as no-JS / reduced-motion / `data-motion='reduced'` default; sphere `aria-hidden`; category chips (beside Cloud|List, D39); official-site caption on tap; `touch-action: pan-y`; rAF only while in view and the tab is visible; pause-animations toggle kills float + auto-rotate (drag still works); lazy chunk + same-size placeholder; no React state per frame.
  - **Density:** ≥768px all 85; `<768px` priorities 1–2. Priorities assigned so phones land around 40 items (p1 core + p2 everyday), the long tail is p3.
- **Inventory** (category → name, priority). Icon slugs to be audited in Phase 4 against simple-icons / devicon, same pipeline as D13, plus original-color geometry for the cloud.

  Languages: JavaScript 1, TypeScript 1, HTML5 1, CSS3 1, SQL 1, Go 2, Java 2, Python 2, PHP 2, Lua 2, Ruby 3, C 3, Kotlin 3, Bash 3, VBA 3 (Devicon `visualbasic`).

  Frontend: React 1, Vue.js 1, Next.js 1, Tailwind CSS 1, Nuxt 2, React Native 2, Expo 2, Electron 2, Vite 2, AngularJS 3, Sass 3, Bootstrap 3, Material UI 3, Redux 3, jQuery 3, Zustand 3, TanStack Query 3.

  Backend: Node.js 1, Express 1, GraphQL 1, Bun 1, NestJS 2, Fastify 2, Prisma 2, gRPC 2, Swagger 3, FeathersJS 3, Laravel 3, Spring 3, Apache 3, Socket.io 3, Axios 3, Composer 3, npm 3.

  Data: PostgreSQL 1, Redis 1, MongoDB 2, MySQL 2, RabbitMQ 2, Kafka 2, Pub/Sub 2, BigQuery 2, DynamoDB 3, Elasticsearch 3.

  Cloud: AWS 1, Google Cloud 1, Docker 1, Git 1, GitHub 1, Vercel 1, Kubernetes 2, GitHub Actions 2, Terraform 2, Android 2, GitLab 3, ArgoCD 3, CircleCI 3, Firebase 3, Datadog 3, Linux 3.

  Integration / DX: Okta 2, Stripe 2, Sanity 2, SAP 3, Figma 3, Postman 3, Jira 3, Mapbox 3, Cypress 3, Jest 3, ESLint 3, Babel 3, Excel 3, Power BI 3, SharePoint 3 (monograms).

  AI agents & tooling (D39): Cursor 2, VS Code 3 (monogram), Claude 3, GPT 3 (monogram), Gemini 3, Lovable 3.

- **Dark marks:** brand fill is lifted to `#e8eaf0` when relative luminance &lt; 0.25 (covers the prototype invert set without CSS `filter: invert`).
- **Consequence.** Cloud looks like the prototype (color, depth, drag) and stays legal for this repo. Fixtures grow from 46 → 96; `icons:audit` must re-run. Phone cull (`priority ≤ 2`) lands around 49 items. Five monograms remain (Excel, Power BI, SharePoint, VS Code, GPT). The sixth-category-only rule is amended by D39.

### D38 — Tech cloud is full-bleed

- **Context.** D37 sized the geoid to `min(720px, 100%)` inside `container-page` so 96 marks would breathe. After seeing it live, the owner asked for 100% of the display width.
- **Decision.** The geoid (and its lazy placeholder) is a full-bleed `aspect-square w-full` stage: `#stack` is the viewport column, not the 1200px measure. The section header, Cloud|List control, List view, live caption and category chips stay in `container-page`. Projection still uses `min(width, height)` of the stage, so the circle diameter equals the display width.
- **Consequence.** On a 1440px desktop the sphere is ~1440px tall. Horizontal overflow stays a non-issue because the stage is `w-full` of the already-full-width section, not `100vw`.

### D39 — Stack chrome and a 7th tech category

- **Context.** After seeing the Phase 4 geoid, the owner asked to drop the redundant “Switch to list view” control (Cloud|List already does it), drop the “Hover or tap a logo to see its name.” hint (the name overlay should be a surprise), drop the thin orbit ring, move the category chips next to Cloud|List, and add “AI agents & tooling”. D37 had parked AI/DX in Integration so chips stayed at six.
- **Decision.** Category id `ai`, labels “AI agents & tooling” / “Agentes de IA e ferramentas”. Move Cursor, VS Code, Claude, GPT, Gemini and Lovable out of Integration. Chips sit in the Cloud|List row (cloud view only). The live caption still announces a tap; it is empty until then. Soft orbit glow stays; the `inset-[18%]` ring goes.
- **Consequence.** Seven chips. Integration 15, AI 6; totals and priorities unchanged (96, 21/28/47). No unused i18n keys. List headings pick up the 7th group from `techCategories` order. The development Sanity dataset was still the 46-item Appendix C seed, so the AI chip stayed hidden (`count === 0`) until those six documents existed there (D40).

### D40 — Rectangular geoid stage and chip toolbar

- **Context.** D38 made the stage `aspect-square w-full`, so a 1440px display produced a 1440px-tall square. The owner asked for full viewport width and about 80% of the display height, chips flushed right via `justify-between`, a pointer cursor on the filters, and the missing AI chip.
- **Decision.** Stage class `h-[80svh] w-full` (placeholders included). Projection uses independent X/Y radii (`width×0.4`, `height×0.4`) and Z from `min(width,height)` so the cloud fills the rectangle. Filter chips live in a `toolbar` with `aria-pressed`, an accessible name that includes the count, and `cursor-pointer`. Cloud|List stays a `group` on the left; the chip row is `ml-auto justify-end`.
- **Consequence.** The geoid is an ellipse in landscape, not a circle. `rounded-full` on the stage would have become a capsule, so the glow uses `rounded-[50%]`. Development Sanity needed the six `ai` documents or the chip stays omitted.

### D41 — Geoid stage min-height 600px

- **Context.** D40 set the stage to `h-[80svh]`. On short displays (phones, short laptop windows) that is well under 600px and the ellipsoid looks cramped. 720px was tried first and felt too large.
- **Decision.** Keep `h-[80svh] w-full` and add `min-h-[600px]` on the same `geoidStageClassName` (live geoid and placeholders).
- **Consequence.** Below ~750px of viewport height the stage is taller than 80svh and the section scrolls. Width is unchanged (still full-bleed, D38).

### D42 — No Cloud|List toggle

- **Context.** Cloud|List duplicated what reduced-motion already decided, and D39 had already dropped the extra “Switch to list view” copy.
- **Decision.** Remove the control and the unused `viewLabel` / `viewCloud` / `viewList` strings. After hydrate, the geoid shows unless `useReducedMotionPreference()` is true (`prefers-reduced-motion` or Pause animations). SSR / no-JS / geoid crash still render List. Category chips stay in cloud view only.
- **Consequence.** Visitors cannot pick a view. Pause animations still switches to List because it shares the reduced-motion signal (D37).

### D43 — Center category chips

- **Context.** After Cloud|List went away (D42), right-aligned chips looked stranded on a full-width row.
- **Decision.** The filter toolbar is `justify-center` inside `container-page`.
- **Consequence.** Wrapped chip rows stay centered. D40’s `justify-between` / `ml-auto` no longer apply.

### D44 — Category filter mutes unmatched icons

- **Context.** Unmatched marks at 0.22 opacity still accepted hover/tap, so names popped on icons the filter had visually retired.
- **Decision.** Unmatched depth opacity is multiplied by `0.08`. They get `pointer-events: none` (and no `data-interactive`), so CSS hover-name and slowdown only run on matches. Click/tap and an in-flight caption ignore unmatched ids.
- **Consequence.** Filtering is exclusive: the rest of the geoid is scenery. Drag on the stage still works through the muted marks.

### D45 — Filter dim eases in rAF

- **Context.** Snapping unmatched icons to 8% opacity on chip click felt abrupt. A CSS `transition: opacity` on the item would also lag the per-frame depth fade as marks orbit.
- **Decision.** Lerp a `dimMultiplier` toward 1 or `CATEGORY_DIM` (factor `0.12`, ~250ms). Depth opacity stays a direct rAF write. Pointer-events still switch immediately. A paused geoid snaps.
- **Consequence.** Chip toggles cross-fade; orbit dimming stays sharp.

### D46 — Home section order: quote, summary, résumé tabs

- **Context.** The owner asked to rearrange Home to Hero → Quotes of the moment → Summary → About → Stack → Work → overall résumé (experience + education + PDF + LinkedIn, contracted) → Contact → Recommendations.
- **Decision.** Split the old About block: Summary (`#summary`) is facts + up to 4 metrics; About (`#about`) is the bio. The featured quote (`#quote`) sits after the hero with the eyebrow “Quotes of the moment” / “Frases do momento”; still one `featuredQuote` (no CMS array). The career block is `#resume` with native radio tabs (Experience | Education) styled as a pill; CSS `:has()` shows the matching panel so the first HTML matches the client and no-JS can still switch. Jobs are all native `<details>`; the current role (`end` empty) starts open. CTAs are the locale PDF plus the owner’s LinkedIn (`isOwnProfile` and url/id containing `linkedin`). Nav is About · Stack · Work · Résumé · Contact. Quote, Summary and Recommendations stay off the primary nav. Hashes `#experience` / `#education` / `#resume` still resolve. `collapsedByDefault` stays in the schema but no longer drives the public UI.
- **Consequence.** Recruiters hit the quote and numbers before the bio; the long timeline is opt-in. Bookmarks to `#experience` still work. Radios rather than exclusive `<details name>` because the two panes are different document shapes.

### D47 — Hero art direction and concise headline

_The headline and rotating-word parts are superseded by D67 (the H1 is now the name)._

- **Context.** The owner supplied a square jpg and a 3:4 png for the hero, asked for a shorter H1, and the rotating line was stacking every word because `text-gradient` (`background-clip: text`) lived on the shared grid wrapper.
- **Decision.** Profile gains optional `photoLg`. Fixtures encode `profile-photo.jpg` → 800×800 WebP and the transparent 3:4 PNG (`julio_retrato_fundo_transparente_degrade.png`) → 720×964 WebP with alpha preserved; authored specs skip SVG generation. Hero uses `getImageProps` + `<picture>` (`min-width: 1024px` → lg, else square) with `priority` and sizes for LCP; square accent-ring frame below `lg`; from `lg` up the 3:4 `photoLg` is frameless, fluid (`clamp` on width, 18rem–31.5rem), and blends into the hero (alpha, no card). Headline copy is “Messy problems, reliable software.” / “Problemas bagunçados, software confiável.” Gradient moves onto each rotating word; the wrapper is a clipped `h-[1.2em]` slot. Owner photos are real identity (same bucket as name/title/city) but still flow only through `getContent()`.
- **Consequence.** One hero image downloads per viewport. OG/JSON-LD keep the square `photo`. `fixtures:generate` no longer wipes the portrait masters. Sanity needs a `photoLg` field (optional) for the same art direction in production.

### D48 — About absorbs Summary

- **Context.** After D46 split About into Summary (facts + metrics) then bio, the owner asked to put the bio back on the left and a few stats on the right of the same section.
- **Decision.** One `#about` section: `bio` in the existing measure column; up to 4 `metrics` as a 2×2 tile on the right from `lg` (stacked below on smaller screens). `#summary` stays on the stats list so old hashes and the e2e order check still resolve. Quick facts (`location`, `spokenLanguages`, `focus`) drop off the public page — they remain in the terminal snapshot. Section numbers after About decrement by one. Hero scroll-cue fallback is `#about`.
- **Consequence.** Recruiters see who he is and the numbers in one viewport. A `#summary` bookmark lands on the tiles, not a missing section.

### D49 — Window manager ships dark: shortcut-only entry until Phase 6

- **Context.** Phase 5 builds the generic window system (§9), but the terminal that fills it is Phase 6. A visible `>_` toggle, hero CTA or dock chip would open an empty window for visitors.
- **Decision.** `<TerminalWindow />` is mounted in `[locale]/layout.tsx`. Nothing renders until the window is opened (no SSR markup, so `check:seo` and the HTML are unchanged). The only entry is `Ctrl/Cmd + /`; the body is a localized placeholder (`terminal.comingSoon`). The dock chip appears once the window has been opened and is shown only while it is closed or minimized (while open it would sit under the default bottom-right rect). The header `>_` toggle, hero "Open the terminal" CTA, footer hint and the one-time "type help" dock hint arrive with Phase 6.
- **Geometry.** Pure functions in `src/lib/window-manager/geometry.ts`, store in `src/stores/window-store.ts` (both unit-tested). Gestures write `transform`/`width`/`height` straight to the DOM in rAF and commit to the store on release; `Esc` or `pointercancel` reverts (WCAG 2.5.2). Top-edge snap keys off the pointer reaching the screen edge (y ≤ 8), because the window itself is clamped below the header. Snap preview has no fade yet (Phase 10; done in D63).
- **Motion.** Open/minimize/close use CSS transitions on `transform` and `opacity` (≈280 ms, `--ease-out-expo`) rather than Motion springs; reduced motion is handled by the existing global rule. Maximize/restore transition `width`/`height`, a deliberate layout animation on a single element.
- **Persistence.** `sessionStorage['jm.window.<id>.v1']` (status, maximized, rect; validated with zod). A closed window is not persisted, so a reload after closing starts unmounted with default geometry.
- **Consequence.** (Entry points superseded by D50.) No public change for visitors until Phase 6 flips the entry points on. The frame is bundled in the layout client chunk (about 5 KB), not lazy; revisit with the terminal body in Phase 6. The `visualViewport` keyboard offset is implemented but only meaningful once the terminal input exists.

### D50 — Public terminal: lazy core, live entry points

- **Context.** Phase 6 fills the window (D49) with the terminal of §10.1–10.5. The owner chose: the full §10.4 list without the easter eggs, all visible entry points on, strings in a lazy chunk, no separate design doc.
- **Decision.**
  - **Entry points are live** (D49's "dark" rule is superseded): header `>_` toggle with a shortcut tooltip, hero "Open the terminal", footer hint (`footer.terminalHint` is now a rich tag, `<kbd></kbd>`), and the dock chip from the first page load. The chip is hidden only while the window is open (it would sit under the default rect). The one-time "Try the terminal: type help" hint shows 1.5 s after load, once per session, never after an interaction and never with reduced motion or Pause animations.
  - **Core vs UI.** `src/lib/terminal/` is pure TypeScript (tokenizer and args, output AST, virtual file system, registry, engine, completion, history, session). The React shell lives in `src/components/terminal/` and is one `next/dynamic` chunk loaded when the window is first opened; the window frame, shortcut and dock stay in the layout chunk.
  - **Strings.** The big `terminal` namespace is never in the provider: `catalog.ts` dynamically imports the locale catalog and builds a `createTranslator`, so the strings are a lazy chunk per locale. Window, dock and toggle labels moved to a small `window` namespace that does ship with the provider. Commands take a plain `t(key, values)`; unit tests use a translator that throws on any missing key, in both locales.
  - **Snapshot.** `GET /api/terminal-content?locale=en|pt` (Route Handler, request-time, `s-maxage=300`, `X-Robots-Tag: noindex, nofollow`, 404 for a missing or unknown locale) maps repository output through `buildSnapshot`: no phone, icons, file URLs or hidden items. It is fetched once per locale per tab and warmed on idle after load; content commands show a spinner while it loads and a friendly error if it fails, and the rest keeps working.
  - **Engine.** `execute()` is an async generator: it tokenizes, resolves the command, answers `--help`, loads content only for commands that need it, and streams output. Unknown commands, unsupported syntax (`;` `&` `|` `>` `<` `*` `?` `$`) and failed loads come back as output. An aborted `delay` rejects and the engine swallows it, so Ctrl+C stops streaming cleanly.
  - **Session.** `sessionStorage['jm.terminal.v1']` holds up to 300 blocks, 100 history lines and the cwd; spinners, volatile blocks and one-shot typing are never saved. Closing the window ends the log and keeps the history. A language switch is a full page load (`[locale]` is the root layout), so the window and session rehydrate from storage.
  - **Keyboard.** Tab completes only when there is something to complete; on an empty line it moves focus on, so the terminal is never a keyboard trap. `Ctrl+W` keeps the whitespace before the removed word. A multi-line paste runs the first line and says so.
  - **Secrets.** The registry already separates public and secret commands (help, completion, suggestions and history only see public ones, covered by tests with a fake secret command). No secret command is registered until Phase 7, so `su`, `admin` and `logout` are plain unknown commands for now and are recorded in history; Phase 7 registers them and they drop out.
  - **Small calls.** The boot banner is the 22-column JM mark with a one-word fallback below 14 rem of container width. `git log --oneline` hashes are FNV-1a of `slug:title:start`. `open`/`resume --download` use a new-tab anchor, so a popup blocker can interfere. The window title follows the cwd (`visitor@julio-muller: ~/projects`).
- **Consequence.** The terminal is a visible signature feature on every page. The first open fetches two lazy chunks and one JSON (about 20 KB). `CloudErrorBoundary` became the generic `ErrorBoundary`. Admin-session UI (`session` pill, red prompt, `readSecret`) stays for Phase 7.

### D51 — Admin access: fixed `/admin`, proxy gate, signed session

- **Context.** Phase 7 (§10.6, §12.1–12.5). §12.1 names `/admin/**` while §10.6 wants the path out of every client bundle; the owner chose a **fixed `/admin`**, plaintext password plus a hash script, in-memory rate limiting, and a shell with a light dashboard.
- **Decision.**
  - **Gate.** `src/proxy.ts` verifies the cookie (jose, HS256) for `/admin/**` and rewrites everything else to the same global 404 as any unknown path (body and headers are compared in e2e). Admin pages, the layout and every action also call `requireAdmin()`. The admin's own headers (`X-Robots-Tag` with the AI opt-outs, `Referrer-Policy: no-referrer`, `no-store`) are set in the proxy **only on the allowed branch**: a `next.config` header rule would also mark anonymous 404s and give the path away. `/api/**` gets `X-Robots-Tag` from `next.config`.
  - **Session.** Claims `sub`, `iat`, `exp`, `jti` plus `ses` (login time), so the 8-hour cap holds across renewals. Idle expiry is 30 minutes. The proxy re-issues the cookie at most once a minute, but never for Server Action posts (`next-action` header), so checking the session never extends it. The expiry dialog re-checks with the server before warning and renews through `renewSession`.
  - **Cookie.** `__Host-jm_session` with `Secure` when `NEXT_PUBLIC_SITE_URL` is https, plain `jm_session` otherwise. Tying both to the site URL (rather than `NODE_ENV`) keeps `next start` over http usable in e2e and WebKit. `HttpOnly`, `SameSite=Strict`, `Path=/`.
  - **Password.** `ADMIN_PASSWORD` is HMACed with `SESSION_SECRET` and compared in constant time; `ADMIN_PASSWORD_HASH` (scrypt, `bun run admin:hash`) wins when set. The hash format is `scrypt:N:r:p:salt:hash` with no `$`, so env-file expansion cannot mangle it. The admin is disabled (generic failure everywhere) unless `SESSION_SECRET` has 32+ characters and a password or valid hash exists; production also needs a 16+ character password. Problems are logged once, by variable name.
  - **Brute force.** `RateLimiter` interface with an in-memory default: 5 failures per 15 minutes lock a client for 15 minutes (doubling per repeat lockout, up to 24 h), and 30 failures per hour pause everyone. Every response waits at least 800 ms plus up to 200 ms of jitter, success included. Upstash is **not** built (known gap; the interface is the seam). The client key is an HMAC of the first `x-forwarded-for` entry (or `x-real-ip`), so a self-hosted deployment must sit behind a proxy that overwrites that header.
  - **Shell.** Own root layout (`lang="en"`, no public chrome), sidebar and mobile tab bar with only Dashboard live, top bar with data-source badge, View site, session countdown, Sign out and the §12.2 expiry dialog. The dashboard shows visible-item counts; "needs attention", recent changes and revalidation wait for Phase 8 because the repository only returns visible items. `/admin` is forced dynamic by reading cookies first (otherwise a build without credentials prerenders the 404).
- **Consequence.** `admin <area>` for areas that Phase 8 has not built leads to a plain 404 even when signed in. Rotating `SESSION_SECRET` signs everyone out.

### D52 — Terminal secret commands and secret-input mode

- **Decision.**
  - **Isolation.** `secret/names.ts` (three names) is the only secret code in the public terminal chunk; the module with `su`, `admin`, `logout` and their English strings loads by dynamic import when a line starts with one of the names, or when a session has to be re-checked. Public chunks contain neither `Authentication failure` nor `/admin` (e2e scans every loaded script).
  - **`su`.** Any target, or none, prompts for the password; the admin being disabled also just fails generically, so it needs no extra round trip. Secret mode renders a native `type="password"` input named "Password" with no echo and no caret. Paste works, Ctrl+C cancels, the value lives in the input and one local variable only. Success prints `Authenticated.` and hard-navigates to the `redirectTo` the server returned (the admin is another root layout).
  - **`admin` / `logout`** are plain unknown commands without a session: the engine drops them before the not-found path, so the output is byte-identical (unit-tested). `--help` is not answered for secret commands, and they have no catalog keys.
  - **Trace.** Secret lines and their output are `volatile`: never persisted, never recorded in history. This also applies to the unknown-command fallthrough of those three names, which is a harmless local difference after a reload.
  - **State.** The server is the authority: `getSessionStatus()` runs when the terminal mounts and on window focus while signed in; the client only keeps `session` (expiry and base path) in memory in `session-store`. An expired clock triggers a server check; if the session is really over the next command prints `session expired` and the prompt returns to `visitor@…$`. The prompt becomes `julio@…#` (red `#`) and the title bar shows a `session · Nm` pill.
- **Consequence.** Every visitor who opens the terminal makes one `getSessionStatus` Server Action call. The names `su`, `admin` and `logout` are visible to anyone reading the public chunk, which §10.6 accepts (its secrecy is UX, not security).

### D53 — Admin write path: store, service, revalidation

- **Context.** Phase 8 (§11.6, §12.6–12.9). Repository reads are visible-only and validated, so the admin could not reuse them. The owner chose the full spec in ordered slices, native drag plus up/down buttons, fake uploads in fixtures mode, a smoke run on `development`, and smoke-only e2e.
- **Decision.**
  - **`AdminStore`** (`src/lib/content/admin/`): `list/get` return documents in schema shape, hidden ones included and **unvalidated** (a document with a missing translation must still open so it can be fixed); `write/patch/remove` return `ok | conflict | missing | exists`. Two adapters: fixtures (in-memory, the same dataset object the public fixtures source reads, via `fixtures/shared.ts`) and Sanity (`@sanity/client`, `useCdn: false`). Reads use the write token, falling back to the read token with a read-only reason.
  - **`AdminService`** is the only place that validates and decides: it prunes blank strings and empty objects, strips client meta, assigns ids (`<type>.<uuid>`) and the next `order`, runs the zod schema, then cross-checks (slug uniqueness including other projects' previous slugs, technology ids exist), writes, revalidates and logs `{event: 'admin.write', type, id, action}` (never content). A slug change appends the old slug to `previousSlugs`; changing it back removes it. Deleting a technology that a project or experience uses is refused with the list of users. Toggles (`visible`, `featured`) and reorders go through `patch` **without** full validation, so a broken document can still be hidden.
  - **Concurrency.** Sanity updates are `patch().ifRevisionId(rev)` with an `unset` of dropped fields; creates are `create()`; deletes are one transaction whose first step is a no-op patch carrying the revision. A 409 becomes the conflict dialog (Reload, or Overwrite, which resends without a revision). The fixtures store emulates revisions.
  - **Revalidation.** Server Actions call `updateTag` for `tagsForDocument(...)` (read-your-writes) plus `revalidatePath('/sitemap.xml')`; fixtures reads are not fetch-tagged, so fixtures mode also revalidates `/` as a layout. `POST /api/revalidate` (the Sanity webhook) verifies `sanity-webhook-signature` (`t=<ms>,v1=<base64url HMAC-SHA256 of "<t>.<body>">`, 10-minute tolerance, rate-limited) and uses `revalidateTag(tag, 'max')`; anything invalid is a bare 404. Set the webhook's projection to `{_type, "slug": slug.current}`.
  - **Fixtures in production.** Writable outside production; `ADMIN_FIXTURE_WRITES=1` (e2e only) allows it in a production build. Otherwise the admin shows "Demo data, read-only" and every write returns `readonly`.
  - **Config.** `proxyClientMaxBodySize: 12mb` (the proxy buffers bodies, 10 MB by default) and `serverActions.bodySizeLimit: 2mb`.
- **Consequence.** In fixtures mode public HTML is regenerated lazily, so an edit can take seconds to appear on a cached page (the terminal snapshot, which is uncached, shows it at once). Reorders renumber `order` to 10, 20, … for the rows that changed.

### D54 — Uploads and sanitizers

- **Decision.** `POST /admin/api/upload` (session, same-origin by `Origin` and `Sec-Fetch-Site`, 60 uploads per 10 minutes per session) accepts `file` and `kind`. Images (≤ 8 MB) are identified by magic bytes (JPEG, PNG, WebP, AVIF), re-encoded with sharp (EXIF orientation applied, all metadata including GPS dropped, longest side ≤ 4000 px, alpha kept, never enlarged) and uploaded with an LQIP. PDFs (≤ 10 MB) must start with `%PDF-` and contain no `/JavaScript`, `/JS` or `/Launch`; objects inside compressed streams are not inspected (shortcut). SVG is never an upload: custom icons are pasted or picked as text and sanitized into `{ viewBox, paths }` (strict element allowlist, scripts, styles, `use`, `foreignObject`, images and handlers dropped; strokes, transforms and group fills are refused with a message rather than silently changed; 20 KB cap).
- **Fixtures mode.** The full pipeline runs, then a placeholder asset with the real dimensions or size is assigned; uploaded pixels are not shown.
- **Consequence.** An anonymous multipart `POST` to `/admin/api/upload` gets exactly what any unknown path answers to the same request (Next treats multipart posts to a page as a Server Action attempt, so that is a 400 for every path, not a 404).

### D55 — Admin UI structure

- **Decision.** One dynamic route tree (`/admin/[area]`, `/new`, `/[id]`) driven by `areas.ts` and `area-config.tsx`; ten areas plus Practices. Admin URLs carry only the uuid part of an id (`/admin/recommended/<uuid>`) because the proxy lowercases every URL and ids contain capitals. Forms are client components built from shared fields (`LocalizedField` with side-by-side EN/PT from 1024 px and tabs below, counters, completeness badge, copy EN → PT, identical-text warning; Markdown editor with toolbar and safe preview; image field with focal point; list editor with up/down and drag; checkbox groups; icon pickers with server-side search). The editor keeps a dirty guard (browser prompt plus a confirm on in-app links), an error summary that takes focus and links to fields, a conflict dialog and typed-confirmation delete. Saves answer with the stored document so local state matches the server (for example the new `previousSlugs`). The dashboard shows counts with hidden ones, a "needs attention" list (missing Portuguese, images without alt text, project title and summary lengths, more than six featured projects), recent changes and the two buttons.
- **Consequence.** The dirty guard cannot stop the browser's Back button. Sidebar labels, the badge and all admin copy are English only.

### D56 — Security headers as built (Phase 9)

- **Context.** D4 chose the policies; Phase 9 implements them (§15). The owner chose HSTS without `preload`.
- **Decision.**
  - `src/lib/security/headers.ts` builds both policies and the common headers; it is dependency-free because `next.config.ts` imports it. `next.config` `headers()` puts the public CSP plus `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` denying 20 unused features, `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy: same-origin` and `X-Permitted-Cross-Domain-Policies: none` on **every** path, so the anonymous admin 404 carries exactly the headers of any other 404. On the allowed admin branch the proxy replaces the CSP with a per-request nonce policy (`'nonce-…' 'strict-dynamic'` for scripts, nonce for styles) and sets `Referrer-Policy: no-referrer`.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains` and `upgrade-insecure-requests` are sent only when `NEXT_PUBLIC_SITE_URL` is https (the same switch as the `__Host-` cookie). On the plain-http e2e server WebKit would otherwise upgrade localhost requests.
  - **`experimental.sri` is not enabled.** Under Turbopack it stamps `integrity` on only some of the chunks, and every chunk is same-origin, so it would protect little while looking complete.
  - The zod import in `use-window-sync.ts` (the only client use) was replaced with a hand-written guard: zod v4 probes `new Function('')` for its JIT, which the CSP reports as a violation, and it put zod's runtime in the initial bundle.
  - `tests/e2e/security.spec.ts` asserts the headers and records `securitypolicyviolation` events on the public routes, with the terminal and the lightbox open, and across the admin: zero allowed.
- **Consequence.** `style-src-attr 'unsafe-inline'` stays (Motion and `next/image` placeholders write style attributes). The public `script-src 'unsafe-inline'` trade-off of D4 is unchanged.

### D57 — Precompiled messages

- **Decision.** next-intl's `experimental.messages` (`path: ./messages`, `format: json`, `precompile: true`) compiles ICU messages at build time, so the client ships the format-only runtime instead of the ICU parser (about 8 KB gzip off every public first load). Code must read messages through a translator, never as raw strings. `global-not-found.tsx` now uses `createTranslator`.
- **Consequence.** `messages/*.json` imported in app code resolve to compiled objects; scripts run by Bun outside Next (`i18n:check`) still read the source JSON.

### D58 — Bundle budgets as enforced

- **Context.** §16 sets initial JS for Home at ≤ 150 KB gzip. The framework floor alone (Next 16.4 + React 19.3; `/_not-found`, which ships no app code) is **135.5 KB**, leaving 15 KB for Motion's `m` runtime (~16 KB), next-intl (~7 KB), lucide icons, tailwind-merge and the shell.
- **Decision.** `bun run check:bundle` (CI, after the build) reads `.next/diagnostics/route-bundle-stats.json` and enforces regression ceilings instead: Home 195 KB (measured 190.7 KB after D56/D57, down from 198.9 KB), projects and detail 190 KB, accessibility and catch-all 185 KB; lazy chunks terminal ≤ 20 KB (12.6), secret ≤ 3 KB (0.9), sphere ≤ 10 KB (3.4). It also fails when a public first load contains terminal or secret code, when any chunk outside the admin's first load mentions the admin path, and when any client file contains a server-only variable name or the value of one present in the environment. `next analyze --output` gives the module breakdown.
- **Consequence.** A documented deviation from §16 for the owner to accept or revisit: reaching 150 KB would mean dropping Motion and next-intl from the client. Lighthouse CI (Performance ≥ 95, TBT < 150 ms) remains the user-facing gate.

### D59 — Technology logos as cached files; document weight

- **Context.** Home's HTML was 690 KB (232 KB gzip): the stack's 96 logos were inline SVG paths, written once into the HTML and again into the RSC payload (every rendered element is in both). That pushed simulated FCP to ~2 s.
- **Decision.**
  - Logos are content-addressed files: `GET /tech-icons/<hash>.svg` (`src/app/tech-icons/[file]/route.ts`), where the hash (`iconHash`, two FNV-1a passes over viewBox and paths) changes whenever an icon changes, so responses are `Cache-Control: public, max-age=31536000, immutable`. Only visible technologies resolve; anything else is 404. `?fill=<6 hex>` colors the file for the geoid's `<img>`; the List view draws the same file as a `currentColor` CSS mask (CanvasText under forced colors). The server `Stack` section maps technologies to `StackTech` with `{ src } | { monogram }`, so no path reaches the client. The proxy lets `/tech-icons` through.
  - The project detail page keeps inline icons (a handful per page).
  - JetBrains Mono is no longer preloaded (labels only); Geist stays preloaded.
  - LCP images: the detail cover uses `preload` + `fetchPriority="high"` (`priority` is deprecated in Next 16); the first card on `/projects` gets `fetchPriority="high"`.
- **Consequence.** Home HTML is 278 KB raw / 47 KB gzip. The List view needs CSS masks (all supported browsers); no-JS still shows every logo.

### D60 — Lighthouse CI thresholds as enforced

- **Context.** §16 asks for Performance ≥ 95, LCP < 2.0 s and TBT < 150 ms (mobile, simulated throttling). Lighthouse's simulated LCP counts every request that starts before the observed LCP, and the App Router requests the whole first-load JS (~190 KB, D58) before first paint; locally, observed LCP is ~150 ms but simulated LCP is 2.8–3.5 s. After D56–D59, local medians: detail pages 0.95, `/projects` 0.93–0.94, Home 0.89–0.92 (TBT 200–250 ms from hydration). Accessibility, Best Practices and SEO are 100 on every URL; CLS is 0.
- **Decision.** `lighthouserc.json` runs 3 times per URL (Home, `/projects`, one detail page; both locales) in CI with `bun x @lhci/cli@0.15.1` (on demand, so its dependency tree stays out of `bun audit`), uploads reports as an artifact, and **fails** on: accessibility < 1, SEO < 1, best practices < 0.95, CLS > 0.05, and the regression floors performance < 0.85, LCP > 3.8 s, TBT > 350 ms.
- **Consequence.** The §16 performance, LCP and TBT targets are **not met** and are not enforced at their spec values; the owner decides whether to accept the floors or fund deeper work (for example, moving the hero animations and the window-manager shell off the initial hydration path). Running `lhci` under WSL leaves Chrome profile folders named `C:\Users\…\lighthouse.*` in the working directory; delete them (Tailwind's scanner trips over their sockets).

### D61 — Cross-browser smoke and visual baselines

- **Context.** The owner chose a Firefox smoke run on the public specs and CI-generated screenshot baselines.
- **Decision.**
  - A `firefox` Playwright project (Desktop Firefox) runs the public specs (`shell`, `projects`, `terminal`, `window`, `stack`, `security`, `a11y`); the admin specs stay on Chromium, WebKit and the mobile project. CI installs Firefox alongside Chromium and WebKit.
  - The Firefox pass found test-harness problems only, fixed in the tests: the terminal helpers pressed the toggle shortcut repeatedly, so a slow mount closed the window again (`tests/e2e/hydration.ts` now waits for React hydration, then gives each press 5 s); a window drag left the viewport, where synthetic pointer moves are not reported; one test measured scroll across two page loads. Two checks are adjusted per browser with a stated reason: Firefox empties `clipboardData` on synthetic paste events (the multi-line paste test is skipped there), and headless Firefox keeps focus on the last tab stop when Tab leaves the page (the idle-Tab test asserts that the default action is not prevented).
  - Visual snapshots (`tests/e2e/visual.spec.ts`): the hero and the first project card at 375, 768 and 1440 px, Chromium only, reduced motion, animations disabled, `maxDiffPixelRatio: 0.01`. Baselines live in `tests/e2e/__screenshots__/` (Linux). They run in CI and locally only with `VISUAL=1`; the manual `Visual baselines` workflow regenerates them on the CI image and uploads them as an artifact.
- **Consequence.** The first baselines were generated under WSL Linux with the self-hosted fonts; if CI's rendering differs beyond the tolerance, run the workflow once and commit its PNGs. Manual checks on real Safari/iOS 16 and Edge remain in the launch checklist (README).

### D62 — Card → detail cover morph (Phase 10)

- **Context.** §5.10 asks for a View Transitions morph from a card cover into the detail hero when the installed Next.js supports it stably. React 19.3 exports `<ViewTransition>` from its stable build (client and `react-server`), and Next 16.4 starts the transition for App Router navigations without a config flag.
- **Decision.**
  - `CoverTransition` (`src/components/portfolio/cover-transition.tsx`) wraps the cover `img` (or the generated art) in `<ViewTransition name="project-cover-<slug>" share="project-cover" default="none">`, both in `ProjectCard` and inside the detail `DeviceFrame`. Only a shared pair animates; unrelated navigations, exits and enters stay `none`. A slug appears at most once per page (the detail page lists related projects other than itself; previous/next are text links), because duplicate names abort the browser transition.
  - `globals.css` gives `::view-transition-group(.project-cover)` 420 ms on `--ease-out-expo`, lets clicks pass through `::view-transition`, and sets `animation: none` on every view-transition pseudo-element for `prefers-reduced-motion` and for `html[data-motion='reduced']` (Pause animations). Without browser support the navigation just happens; without JavaScript the card is a plain link. The existing CSS route fade stays.
  - `<html data-scroll-behavior="smooth">`: Next only turns our `scroll-behavior: smooth` off during route changes when this attribute is present. Without it a new page smooth-scrolled up from the previous scroll offset (a visible ~1 s scroll on every card click), and React measured the hero off screen, so the pair never formed.
- **Consequence.** React names only elements inside the viewport, so a card whose counterpart is below the fold (a related card on the next page) fades out instead of flying off screen. The morph plays when the detail page is already prefetched (cards are in view, so it usually is); otherwise the page appears without it. Checked on Chromium in `tests/e2e/view-transition.spec.ts` (pair animates, reduced motion is instant, no-JS link works).

### D63 — Snap preview refinement (Phase 10)

- **Context.** §9.2 asks for a translucent snap preview that fades in while snapping is armed; D49 shipped it as a hard-cut rectangle mounted through React state on every arm/disarm.
- **Decision.**
  - The preview is one always-mounted `aria-hidden` element (`data-snap-overlay`, hidden on the bottom sheet) written straight on the DOM during a drag: no React state per pointer move. Arming grows it out of the window's current rect into the snap area while it fades in (200 ms, `--ease-out-expo`); switching edges glides between areas; disarming shrinks it back onto the window and fades it out; releasing on a snap only fades it while the window grows into the area. `data-snap-preview=<side>` is present only while armed.
  - Hysteresis: a side arms within 8 px of its edge (`SNAP_THRESHOLD`) and stays armed until the pointer is more than 32 px away (`SNAP_RELEASE`), so a pointer resting on the threshold cannot make it flicker. An armed side wins over a corner; reaching another edge switches sides. `snapSideAt(pointer, viewport, armed)` is pure and unit-tested.
  - Motion is CSS transitions only, so reduced motion and Pause animations make it instant (existing global rule); forced colors hide it (`decorative`), like before.
- **Consequence.** Snapping feels like a desktop OS and the preview never strobes. Covered in `geometry.test.ts` and `window.spec.ts` (arming box, hysteresis, disarm without snapping, transition duration with and without reduced motion).

### D64 — Terminal easter eggs (Phase 10)

- **Context.** §10.4 lists easter eggs as SHOULD; D50 left them out of Phase 6.
- **Decision.**
  - `src/lib/terminal/commands/public/fun.ts` adds, all in the help "Fun" group, localized in both catalogs (`terminal.fun.*`, `terminal.fortune.items.*`) and inside the lazy terminal chunk: `fortune` (12 original engineering maxims, not quotations), `cowsay [text]` (classic cow, word-wrapped at 36 columns by code point; rendered as one `role="img"` with the message as its name, plain text below 20 rem), `matrix`, `ping [host]` (four made-up replies 250 ms apart for `julio-muller`/`localhost`, abortable; any other host says there is no network and offers `contact`), `ssh [host]` (connection refused), `sudo …` (not in the sudoers file; it never runs or grants anything), `rm` (read-only file system; `rm -r` on `/`, `~`, `.` or `..` politely refuses) and `vim` with aliases `vi`, `nano`, `emacs` (one shared line about the read-only file system).
  - `matrix` asks the UI for an effect through a new `actions.effect('matrix' | null)` and waits 4 s with the abortable `ctx.delay`, switching it off in `finally` (Ctrl+C or closing the window ends it). `MatrixRain` is 32 CSS-animated columns of fixed glyphs (deterministic, transforms only, no glyph swapping, so nothing flashes; two React state updates in total). `ctx.reducedMotion` (reduced motion or Pause animations) skips it with a one-line message; the global reduced-motion rule also stops it mid-way.
  - None of the outputs mentions the admin, `su`, sessions or passwords (unit-tested for every egg); `sudo` is public, so the engine test's fake secret command was renamed from `sudoku` to avoid a legitimate "did you mean sudo".
- **Consequence.** The help list grows by eight lines. The terminal chunk grows by about 2 KB gzip (still under its 20 KB ceiling, D58); strings live in the lazy catalog.

### D65 — Studio-ready schemas (Phase 10, extends D29)

- **Context.** §11.10 asks for Studio-ready `defineType` schemas that mirror the zod contract. D29 kept the schema as plain data (no `sanity` dependency) for the schema API, which cannot store functions; a Studio, however, wants previews, orderings and validation.
- **Decision.**
  - `sanity/schema.ts` stays the deployable plain-data declaration (now with titles on every document and object type).
  - `sanity/studio.ts` exports `studioSchemaTypes` (the same types plus `preview`, a "Display order" `orderings` entry for collections, and `validation` on fields) and `singletonTypes`. Validation is built from the zod schemas in `src/lib/content/schema.ts`: each stored field whose name exists in the zod document shape gets `rule.custom()` running that zod field schema (slugs read `.current`; images need an asset and are checked for alt text; gallery items check alt and caption), plus `rule.required()` when zod rejects `undefined`. Limits and patterns therefore cannot drift. `technologies` (references) and résumé files have no field-level twin and are listed in `UNVALIDATED_FIELDS`.
  - The Rule type is a two-method structural interface (`required()`, `custom()`), which Sanity's `Rule` satisfies, so the app needs neither `sanity` nor `@sanity/types`. `docs/SANITY.md` has a `sanity.config.ts` with a singleton-aware structure.
  - Cross-field and cross-document rules are not repeated in Studio; the read pipeline skips and logs a document that breaks them.
- **Consequence.** A separately scaffolded Studio needs `zod` and a relative import of `sanity/studio.ts`. Documents created in Studio get random ids, which the admin's `<type>.<uuid>` URLs (D55) cannot open; create in the admin, edit in either. `src/lib/content/sanity/studio.test.ts` proves every seeded document passes, every zod-backed field is validated, the main rules reject bad input, and previews/orderings exist.

### D66 — Frame-time scaling and drag model for the geoid (from `techs-cloud` PR #1)

- **Context.** The owner's `techs-cloud` prototype fixed its drag and timing in PR #1 (pointer travel accumulated per frame, delta-time scaling, loop paused while hidden). The geoid here derives from that prototype (D37) and had the same flaws: auto-spin, hover easing, category dimming and release friction were per-frame constants tuned at 60 Hz, so the sphere spun about 2.4× faster at 144 Hz; the drag velocity was the last pointer event's delta, so rotation depended on the mouse polling rate and a held-still pointer kept turning the sphere; every pointer move read `clientWidth` (a layout read between style writes); and the rAF loop kept waking the main thread while hidden or off-screen.
- **Decision.** Transposed: frame-time scaling (`k = min(gap, 50 ms) / 16.67 ms`) for spin, hover easing, dim lerp and friction; pointer travel accumulates in `pending` and is consumed once per frame; stationary-hold decay; a stalled frame cannot inflate the release coast; a flick released between frames seeds the coast; second pointers and non-primary mouse buttons are ignored, and window blur ends a touch drag; the stage size comes from the ResizeObserver, never from a pointer handler; the loop stops itself when hidden, off-screen or zero-sized and restarts from the visibility, intersection and resize observers. The math is pure in `src/lib/tech-cloud/motion.ts` (unit-tested at 60/90/120/144 Hz).
- **Not transposed.** `touch-action: none` and `overscroll-behavior: none`: the geoid is a full-bleed stage inside a scrolling page, so it keeps `touch-pan-y` and the separate yaw-only touch path (D37). Pointer Events for touch are therefore not used either. The prototype's `will-change` cleanup does not apply (no `will-change` on the items); the existing change-detection writes, back-hemisphere frame skipping and 4-frame cadence already cover its "cached geometry" point.
- **Consequence.** Same feel at any refresh rate; fewer wake-ups while idle. Release-coast distance is equal across rates within discretization (about 5%).

### D67 — Name as the hero title, selectable title font, header links

- **Context.** The owner wanted a quieter hero before release: the H1 should be his name in a font he picks, without the rotating line, the long lead, the résumé and terminal CTAs or the current-role line. The profile icons and the terminal entry belong in the header.
- **Decision.**
  - H1 = `displayName`, on one line. `heroHeadline` and `rotatingWords` are removed from the contract and both datasets; `heroLead` shrinks to 120 characters, which is under the 70-character floor of `pickDescription` for the meta description, so the home page uses `meta.siteDescription` (intended).
  - `profile.titleFont` picks one of ten Google fonts (Amita, Courgette, Euphoria Script, Kaushan Script, Lobster, Pacifico, Princess Sofia, Redressed, Rock Salt, Sacramento); unset is Geist. They are loaded through `next/font/google`, so they are self-hosted at build time: CSP stays `font-src 'self'`, no request to Google at runtime, no extra privacy surface. Free-form names would break both.
  - `preload: false`: preloading would download all ten. Each font only defines a CSS variable (`--font-title-<id>`) that the root layout sets on `<html>`, and the H1 uses `font-family: var(--font-title-<id>)`, so only the chosen font's file is fetched, after first paint; the size-adjusted fallback limits the swap shift. The hero must not import `styles/title-fonts.ts`: when both the layout and a page import it, Turbopack splits its `@font-face` rules into a second render-blocking stylesheet, which cost `/pt` about 0.03 of its Lighthouse performance score and failed the 0.85 gate in CI. Rock Salt has no latin-ext subset (accents fall back).
  - One-line fitting: `title-fit` sizes the title from the character count in CSS (container query units), and `FitTitle` measures the real text (also after `document.fonts.ready`) and sets `--fit`. It shrinks, never wraps, clips or scrolls the page.
  - Featured-link placement `hero` is renamed `header` (max three icons, from `md`; inside the mobile menu below). The terminal toggle is a primary button with a visible label, icon-only from `md` to `lg`; its `aria-label` still contains the visible word (WCAG 2.5.3).
  - The wordmark name in the header is hidden while the hero is in view (IntersectionObserver in `HeaderFrame`, with a CSS rule so the home page does not flash it).
- **Consequence.** Sanity needs the schema redeployed and the data migrated (docs/SANITY.md): the reader skips a profile with a longer lead and a link still placed in `hero`. Adding a font is a taxonomy id, a loader call and a schema redeploy. The a11y suite (axe 4.14) also required the gallery and tech-chip button names to contain their visible text.

## 5. Contradictions found in the spec and how they are resolved

1. `dynamicParams` "stays on" (§3.1, §8.5) vs Cache Components rejecting the export → D1.
2. `setRequestLocale` in every layout (§6) vs next-intl's deprecation → D2.
3. "No blanket `unsafe-inline`" for scripts (§15) vs static prerendering (§2) → D4.
4. "Latest stable" TypeScript and ESLint (§0, §2) vs peer ranges of typescript-eslint and jsx-a11y → D5, D6.
5. `next-sanity` "if it fits" (§2): it does not → D7.
6. `revalidateTag` in write path (§11.6): deprecated single-arg form → D9 (`updateTag`).
7. `text-3` "still ≥ 4.5:1" (§4.2) is false on `surface-2` → D12.
8. "Skip to content" (§3.2) vs "Skip to main content" (§14.1) → D17.
9. Only `/` negotiates (§3.1, §6) vs next-intl redirecting every unprefixed path → D3.
10. Uploads up to 10 MB (§12.7) vs Vercel's function body limit → R3.
11. Appendix C counts were 18 / 17 / 11 = 46; D37 expands the seed to 96 (21 / 28 / 47), phones render priority ≤ 2 (~49).
12. `sanity/schema/*.ts` with `defineType` (§11.10) vs no Studio dependency (D7) → D29.
13. Filter Motion layout (§8.4) vs Server Component cards → D34.
14. Prerendered `/projects` vs `searchParams` making the segment dynamic → D35.
15. §7 monochrome sphere + 46-item Appendix C vs the owner’s `techs-cloud` prototype → D37.
16. D37 `min(720px, 100%)` stage vs the owner’s “100% of the display width” → D38.
17. D37 “no 7th category” vs the owner’s “AI agents & tooling” chip → D39.
18. D38 square stage vs “100% width and ~80% of the display height” → D40.
19. D40 `80svh` alone vs a cramped cloud on short viewports → D41 (`min-height: 600px`).
20. D37 “keep Cloud | List” vs the owner hiding that control → D42.
21. D40/D42 right-aligned chips vs the owner centering them → D43.
22. D37 unmatched still hoverable vs exclusive filter interaction → D44.
23. CSS opacity transition vs per-frame depth fade → D45 (lerp only the filter dim).
24. Original §3.2/§3.3 order (About → quote → Experience timeline → … → Recommended → Contact) vs the owner’s requested Home order → D46.
25. Appendix A “generated abstract avatar” + long H1 vs owner-supplied portraits and a shorter headline → D47.
26. D46 Summary-then-About vs a single About with stats in the unused column → D48.

## 6. Risks

- **R1 — Status codes under streaming (D1).** Highest technical risk; covered by the Phase 1 spike with a defined fallback.
- **R2 — next-intl + Cache Components + `next/root-params`** are all recent. Mitigation: build verification in Phase 1 that `/en` and `/pt` are emitted as static (`○`/`◐` in build output) and not dynamic.
- **R3 — Vercel 4.5 MB request body limit** vs 8 MB images / 10 MB PDFs. Options in order: client-side downscale before upload for images (canvas, still re-encoded server-side with `sharp`), and for PDFs either cap at 4.5 MB on Vercel or use a short-lived Sanity upload done server-side from a chunked upload. Default chosen: enforce `min(spec limit, platform limit)` and show the effective limit in the admin. Decide definitively in Phase 8.
- **R4 — Devicon single-tone legibility (D13).** Mitigated by the contact sheet review and monogram fallback.
- **R5 — Lighthouse Performance ≥ 95 on mobile** with Motion + an always-mounted window manager. Mitigation: window manager shell is a tiny client component; terminal, sphere and Motion features load lazily (`LazyMotion`), dock chip is plain CSS until interaction.
- **R6 — Activity-preserved routes (Cache Components)** keep hidden routes mounted; rAF loops (sphere, aurora spotlight) must stop on `visibilitychange` _and_ when their route is hidden. Effects are cleaned up on hide per the docs; tests will assert no rAF runs on a hidden route.
- **R7 — Constant-time 404 for admin.** Proxy JWT verification adds microseconds; acceptable ("comparable timing"). The `authenticate` action delay (≥ 800 ms + jitter) is the real timing equalizer.
- **R8 — Server Action origin check behind proxies.** Vercel sets the forwarded host correctly; self-hosting docs must mention `serverActions.allowedOrigins` if a reverse proxy rewrites hosts.

## 7. Assumptions

- Production domain is `https://juliolmuller.com` (`NEXT_PUBLIC_SITE_URL`); preview deployments use their own URL and send `X-Robots-Tag: noindex` (`VERCEL_ENV !== 'production'`).
- Sanity project `njcnsmax` (organization `ow3ahfjbr`) exists with private `production` and `development` datasets (D30). The owner creates the tokens and keeps them in `.env.local`/Vercel; CI runs on fixtures.
- HSTS `preload` is not added until the owner confirms.
- GitHub Actions is available on the repo; Lighthouse CI runs with `@lhci/cli` against `next start`, no LHCI server (temporary public storage disabled; reports kept as artifacts).
- The real résumé, photo and content will be entered later through the admin; nothing real is seeded.

## Vercel Web Analytics (2026-11-02)

- **Decision.** `@vercel/analytics` is mounted in `src/app/[locale]/layout.tsx`. It is cookieless and loads from `/_vercel/insights/*` on the site's own origin, so the CSP (`'self'` only) is unchanged and no banner is needed. `beforeSend` drops any `/admin` URL; the admin tree is outside `[locale]` anyway.
- **Events.** `src/lib/analytics.ts` wraps `track` with a typed name list. `ClickTracker` (one delegated listener) covers server-rendered links: `email_click`, `resume_open` (locale), `external_link` (host). Direct calls: `email_copy`, `language_switch` (to), `terminal_open` (fires on toggle, including close). Properties are never user input; terminal commands are not tracked.
- **Owner step.** Enable Web Analytics in the Vercel project; the script is only served on Vercel deployments.
