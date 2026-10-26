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
  - Public routes (`next.config.ts` `headers()`): `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests`, plus `experimental.sri` (`sha384`) on external chunks. `'unsafe-eval'` in development only.
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
- **Decision.** Phase 3 ships a CSS cross-fade between routes. The card → detail morph is Phase 10 and only if `<ViewTransition>` is available in stable React 19.3 without experimental flags.

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
- **Consequence.** A separate Studio can later `import { schemaTypes }` into `defineConfig` unchanged. Schema changes mean: edit `sanity/schema.ts` → test → redeploy (`docs/SANITY.md`).

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
- **Geometry.** Pure functions in `src/lib/window-manager/geometry.ts`, store in `src/stores/window-store.ts` (both unit-tested). Gestures write `transform`/`width`/`height` straight to the DOM in rAF and commit to the store on release; `Esc` or `pointercancel` reverts (WCAG 2.5.2). Top-edge snap keys off the pointer reaching the screen edge (y ≤ 8), because the window itself is clamped below the header. Snap preview has no fade yet (Phase 10).
- **Motion.** Open/minimize/close use CSS transitions on `transform` and `opacity` (≈280 ms, `--ease-out-expo`) rather than Motion springs; reduced motion is handled by the existing global rule. Maximize/restore transition `width`/`height`, a deliberate layout animation on a single element.
- **Persistence.** `sessionStorage['jm.window.<id>.v1']` (status, maximized, rect; validated with zod). A closed window is not persisted, so a reload after closing starts unmounted with default geometry.
- **Consequence.** No public change for visitors until Phase 6 flips the entry points on. The frame is bundled in the layout client chunk (about 5 KB), not lazy; revisit with the terminal body in Phase 6. The `visualViewport` keyboard offset is implemented but only meaningful once the terminal input exists.

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
