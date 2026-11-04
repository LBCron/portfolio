# Julio L. Muller — Personal Portfolio Site

> **Archived (2026-11-04).** This is the original implementation prompt (Cursor Agent, Claude Opus 5.5), kept for history. It is **not** the current source of truth: the amendments list below, [DECISIONS.md](../DECISIONS.md) and the owner's later changes (D37–D48, D67) override it, and it still says `pnpm` and `.cursor/rules`. Current docs: [PRODUCT.md](../PRODUCT.md) (intent and non-negotiables), [ARCHITECTURE.md](../ARCHITECTURE.md), [AGENTS.md](../../AGENTS.md). Section numbers (`§13.10`, …) cited in code comments refer to this file.

**Implementation prompt for Cursor · Agent mode · Claude Opus 5.5**

## How to use this document

1. Create an empty repository, open it in Cursor and start a new **Agent** chat with Claude Opus 5.5.
2. Paste this whole document as the first message, **or** (preferred) save it as `docs/SPEC.md` and send only the kickoff prompt below. The spec stays versioned in the repo and the agent can re-read it with `@docs/SPEC.md` at the start of every phase.

**Kickoff prompt (short form)**

> Read @docs/SPEC.md completely before doing anything. Then execute Phase 0 (planning only, no code) and wait for my “go”. After that, implement the phases in order. Each phase ends with its verification gate and a commit. Decide and document instead of asking questions, unless you are genuinely blocked.

## Amendments (Phase 0)

Where this list and the body below disagree, this list wins. Rationale for each item lives in `docs/DECISIONS.md` (decision ids in brackets).

- TypeScript is pinned to 6.0.x and ESLint to 9.x because of `typescript-eslint` and `jsx-a11y` peer ranges [D5, D6].
- `@sanity/client` is used directly; `next-sanity` is not used [D7].
- Caching uses classic ISR (segment `revalidate`, `dynamicParams`, `fetch` tags); Cache Components is off because it cannot return real 404/308 statuses for on-demand params [D1b].
- next-intl locale resolution uses `next/root-params` instead of `setRequestLocale` [D2].
- Only `/` negotiates a locale; other unprefixed paths, and anonymous `/admin/**`, render the same global 404 [D3].
- Public pages use `script-src 'self' 'unsafe-inline'` plus SRI on external chunks; admin pages use a nonce CSP [D4].
- Admin writes call `updateTag`; the webhook calls `revalidateTag(tag, { expire: 0 })` [D9].
- `--color-text-3` is `#828a9f` (the original value failed AA on `surface-2`) [D12].
- The skip link reads “Skip to main content” [D17].
- Hosting target is Vercel; upload limits are `min(spec limit, platform limit)` [D10, D11, R3].
- Bun 1.4 replaces pnpm as package manager, and `vercel.json` pins `bunVersion: "1.4.x"` for the Vercel runtime. Read every `pnpm <x>` below as `bun run <x>` and `pnpm view` as `npm view` [D24].
- Both adapters share one pipeline (`createRepository`); adapters only fetch [D25]. Sanity reads use plain `fetch` with `cache: 'force-cache'` and tags; `@sanity/client` is for writes [D26].
- The Studio schema is a single plain-data `sanity/schema.ts` (no `sanity` dependency), deployed to the datasets through Sanity's schema API [D29]. Fixture assets live in `public/fixtures` [D14].
- Datasets: `production` (real) and `development` (fictional seed), both private, in project `njcnsmax` [D30].
- OG/Twitter images are generated with `next/og` from a shared template [D31]. `check:seo` starts its own `next start` [D32]. Unknown `?kind=` / `?page=` on `/projects` are real 404s [D33]. The project filter is link navigation, not a client reflow [D34]. The projects index is request-rendered because it reads `searchParams` [D35]. axe excludes pending `Reveal` nodes; screenshot tests use reduced motion [D36].
- The tech cloud follows the `techs-cloud` prototype: full-color geoid, ~96-item inventory (prototype + recoverable Appendix C marks), yaw-only drag. Icons stay on-origin; List view and reduced-motion still win [D37]. The geoid is full-bleed across the display width (no 720px cap); header, List and chips stay in the page container [D38]. No “Switch to list view”, no hover/tap hint, no orbit ring; category chips sit beside Cloud|List; 7th category `ai` (“AI agents & tooling”) [D39]. The stage is `100% × 80svh` (not `aspect-square`); projection is an ellipsoid filling that rectangle; chips are right-aligned with `justify-between` [D40]. Stage min-height is 600px [D41]. No Cloud|List control; view is the geoid unless `prefers-reduced-motion` or Pause animations; SSR/no-JS stays List [D42]. Category chips are centered (`justify-center`) in cloud view [D43]. Unmatched icons dim to ~8% and lose pointer events; only matches hover/tap [D44]. Filter dim eases in rAF (~250ms); depth opacity stays un-transitioned [D45].
- Motion-init is injected into `<head>` with `useServerInsertedHTML` (not a `<script>` in the layout JSX — React 19.3 rejects that) [D21].
- Home order is Hero → Quotes of the moment → About (bio + metrics) → Stack → Work → Résumé (tabs + PDF + LinkedIn) → Contact → Recommendations. Nav is About · Stack · Work · Résumé · Contact [D46, D48].
- Hero uses art-directed photos (`photo` square below `lg`, `photoLg` 3:4 from `lg` up) via `getImageProps` + `<picture>`; owner-supplied masters are encoded to WebP by the fixture generator and not clobbered by SVG art [D47].
- The window manager hides the dock chip while the window is open [D49]. The public terminal is live: header button, footer hint and dock chip; its code and strings are a lazy chunk, the snapshot comes from `/api/terminal-content`, and secret commands wait for Phase 7 [D50].
- Admin access (Phase 7): fixed `/admin`, proxy gate, session with an extra `ses` claim, `Secure`/`__Host-` following the https site URL, in-memory rate limiter only (no Upstash), light dashboard; the secret terminal flow loads lazily and `su` always prompts [D51, D52].
- Admin write path (Phase 8): an `AdminStore` with fixtures and Sanity adapters behind a validating service, optimistic concurrency, uploads with sanitizers, the signed revalidation webhook, and admin URLs that use the uuid part of ids [D53–D55].
- Phase 10: the card → detail cover morph uses React `<ViewTransition>` (shared pair only, instant for reduced motion and Pause animations), and `<html data-scroll-behavior="smooth">` lets Next disable smooth scrolling during route changes [D62].
- Phase 10: the snap preview is DOM-driven, grows out of the window and fades (instant for reduced motion), with arming hysteresis (8 px to arm, 32 px to release) [D63].
- Phase 10: the §10.4 easter eggs ship (`fortune`, `cowsay`, `matrix`, `ping`, `ssh`, `sudo`, `rm`, `vim`/`vi`/`nano`/`emacs`); `matrix` is a 4 s CSS rain behind an `effect` action, skipped for reduced motion [D64].
- Phase 10: `sanity/studio.ts` layers previews, orderings and zod-backed field validation over the plain-data schema for an optional, separately run Studio [D65].
- About (`#about`) is a two-column block: bio on the left, up to 4 count-up metrics on the right (`#summary` stays on the stats so old hashes resolve). Facts (`location`, `spokenLanguages`, `focus`) stay out of this section (terminal / résumé) [D48].

## 0. Operating instructions (to the agent)

- You act as a principal-level product engineer with strong design taste. This site is a hiring signal for a senior engineer: spacing, motion, copy, accessibility, SEO, security and code are all evaluated.
- Requirement levels: **MUST** = mandatory; **SHOULD** = default unless a documented reason exists; **MAY** = optional polish after everything else passes.
- Fast-moving libraries (Next.js, next-intl, Tailwind CSS, Motion, Zustand, the Sanity client, Playwright): do NOT rely on memory for APIs or versions. Install the latest stable release of each, then read the installed package types and docs (or the official docs) before using an API. Next.js in particular has changed its caching, request-interception (`middleware` / `proxy`) and rendering APIs across recent majors: follow the installed version’s documentation and never use deprecated patterns. Record resolved major versions in `docs/DECISIONS.md`.
- When something is ambiguous, pick the most conservative option consistent with this spec, record it in `docs/DECISIONS.md` (context → decision → consequence) and continue. Ask me only when genuinely blocked.
- **Data policy.** For now ALL content is fictional placeholder data (Appendix A): invented companies, people and metrics, `example.com` URLs. It lives only in the fixtures adapter and the seed script, and it will be replaced through the admin area. Never present anything as a real claim about the owner. The only real values are the owner’s name, job title and city, kept in one config file.
- Verification is part of the work. Run the commands in each phase gate, fix failures, then commit. Never claim something works without having run it. For visual and interaction work, run the dev server and drive it with Playwright (screenshots at 375, 768 and 1440 px), then fix what you see.
- Git: Conventional Commits; at least one commit per phase; small focused commits preferred. Never commit secrets.
- Secrets: server-only variables are never prefixed with `NEXT_PUBLIC_`, never imported from client code (use the `server-only` package) and never printed in logs, tests, screenshots or error messages.
- Language: the entire codebase (identifiers, comments, commit messages, docs) is in English. UI copy is authored in English and in Brazilian Portuguese; write the Portuguese natively, never as a literal translation (§17).
- In Phase 1 create `.cursor/rules/*.mdc` capturing: the conventions of §2, the i18n rule (no hard-coded user-facing strings on public pages), the data-layer rule (components never talk to Sanity directly), the accessibility rules of §14, the security rules of §15 and the data policy above, so later sessions stay consistent.

## 1. Project brief

**Owner.** Julio L. Muller, Senior Full Stack Software Engineer based in Curitiba, Brazil. A multi-disciplinary developer: he builds mobile and desktop apps, automations and integrations, but his core strength is web systems.

**Purpose.** A personal site that presents him as a professional, showcases a portfolio, and proves craft through the site itself.

**Audience.** Recruiters and hiring managers (skim in under a minute), engineering leaders (look for depth and judgment), prospective clients and collaborators.

**Success criteria.** In 10 seconds a visitor knows who he is, what he does and where to click next. The résumé and contact details are never more than one click away. The site feels modern and alive without becoming gimmicky, is excellent on phones, fast, accessible, and fully crawlable and understandable by search engines. The owner can change every piece of public content (text, photos, links, projects, résumé) without touching code.

**Signature features (non-negotiable).**

1. An OS-style **terminal window**: draggable, resizable, minimizable, maximizable, overlaying page content (§9–10).
2. An animated **technology cloud** with logos and names on hover/tap. Never skill meters (§7).
3. **Portfolio cards** with a snapshot, a short description and up to two CTAs, a dedicated expanded page per item, and a curated set of featured projects on the Home page (§8).
4. A **bilingual** site, English and Brazilian Portuguese, covering every public text field (§6).
5. A **dark-only** visual identity (§4).
6. **Fully editable content** through a private admin area backed by Sanity, which stores all data and images and is read and written through its API (§11–12).
7. **Admin access only through secret terminal commands**; the admin area is invisible, non-indexable and returns 404 to everyone without a session (§10.6, §12).
8. **Search-engine and accessibility excellence**: server-rendered pages, structured data, WCAG 2.2 AA at minimum (§13–14).

**Explicit non-goals.** No light theme, no theme toggle, no `prefers-color-scheme` branching, no `dark:` variants. No skill bars, percentages, star ratings or any proficiency visualization anywhere (site or terminal). No Sanity Studio embedded in this app (content is managed through the custom admin area; Studio may be run separately later). No backend, database or auth provider other than those specified in §11–12; no public sign-up and no accounts besides the single admin. No login page, link, button or route hint on the public site. No blog. No cookie banner (the only analytics is cookieless, same-origin Vercel Web Analytics, see D-analytics in DECISIONS). No requests from the browser to third-party origins: fonts, icons and images are served from the site’s own origin, and Sanity is contacted only from the server. No scroll-hijacking libraries.

## 2. Stack and conventions

- **Tooling:** pnpm; Node LTS pinned in `.nvmrc` and `engines`; path alias `@/*` → `src/*`.
- **Language:** TypeScript only (no `.js` / `.jsx` source files), with `strict` plus `noUncheckedIndexedAccess`.
- **Framework:** Next.js, **latest stable release** (check with `pnpm view next version`; scaffold with `create-next-app@latest`: TypeScript, ESLint, Tailwind, App Router, `src/` directory, Turbopack, alias `@/*`). All routes live in `src/app/` (App Router only, no Pages Router). Public pages are **server-rendered**: complete HTML in the first response, and indexable content is never fetched client-side after load. Default delivery is static prerendering with tag-based on-demand revalidation (ISR); use dynamic rendering only where data cannot be cached. Follow the installed version’s caching and rendering model and record the choice in DECISIONS. Deployable to Vercel (default) or any Node host.
- **Request interceptor:** a single `src/proxy.ts` (called `middleware.ts` in older majors; follow the installed version) that handles locale negotiation for `/` and the admin gate (§12).
- **Styling:** **Tailwind CSS v4** (the 4.x line) with CSS-first configuration through `@theme` in `src/styles/globals.css` and the PostCSS/Next integration from the v4 docs. No `tailwind.config.js` unless v4 requires one for a specific feature. `clsx` + `tailwind-merge` as `cn()`, `class-variance-authority` for variants. No CSS-in-JS.
- **Content platform:** Sanity, accessed only from the server with `@sanity/client` (or `next-sanity` if it fits the installed Next.js; verify), GROQ queries and `@sanity/image-url`. `zod` validates every document read and every write; `sharp` processes images before upload (§11).
- **Auth and session:** `jose` for signed session tokens, Node `crypto` for hashing and constant-time comparison. No auth library, no OAuth (§12).
- **Markdown:** `react-markdown` + `remark-gfm` + `rehype-sanitize` (strict schema) for project bodies, rendered on the server (§12.8).
- **Animation:** `motion` (`motion/react`) for declarative animation; hand-written `requestAnimationFrame` loops for the tech sphere and window dragging. No GSAP, Lenis, Three.js or canvas libraries.
- **State:** Zustand for the window-manager and terminal stores (client only).
- **i18n:** `next-intl`.
- **Icons:** `lucide-react` for UI icons. Technology logos come from `simple-icons` (CC0) and `@iconify-json/devicon`, resolved on the server into inline SVG path data, so no icon package ships to the browser. Some brands (e.g. Java, AWS) may be missing from Simple Icons: check, do not assume, and fall back to Devicon, then to a monogram badge. `pnpm icons:audit` MUST fail if any seeded technology has no resolved icon.
- **Fonts:** self-hosted through `next/font`: Geist (UI and display) and JetBrains Mono (terminal and mono labels). Subsets MUST cover Portuguese diacritics (á à â ã é ê í ó ô õ ú ç), the em dash, arrows and the ellipsis.
- **Quality tooling:** ESLint flat config (`eslint-config-next`, `jsx-a11y` strict, react-hooks), Prettier with the Tailwind plugin, Husky + lint-staged, `html-validate`, `schema-dts` for JSON-LD types. Tests: Vitest + Testing Library (unit); Playwright + `@axe-core/playwright` (e2e and a11y). CI: GitHub Actions (§18).
- **Scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `i18n:check`, `icons:audit`, `check:seo`, `sanity:seed`, `admin:hash`.
- **Environment variables** (validated in `src/env.ts` with zod; server-only unless stated; ship `.env.example` with comments): `NEXT_PUBLIC_SITE_URL` (public), `CONTENT_SOURCE` (`sanity` | `fixtures`, default auto), `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION` (a pinned date), `SANITY_READ_TOKEN`, `SANITY_WRITE_TOKEN`, `SANITY_WEBHOOK_SECRET`, `ADMIN_PASSWORD`, `ADMIN_PASSWORD_HASH` (optional), `SESSION_SECRET`, optional `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- **Code conventions:** Server Components by default; `'use client'` only on interactive leaves; named exports (default only where Next.js requires); kebab-case filenames; no `any`; no barrel files except `src/lib/content/index.ts`; tests colocated as `*.test.ts(x)`; env vars read only through `src/env.ts`.
- **Source layout:**

```text
src/
  app/
    [locale]/        layout.tsx page.tsx not-found.tsx error.tsx
                     projects/page.tsx  projects/[slug]/page.tsx
                     accessibility/page.tsx  resume/route.ts
    admin/           layout.tsx page.tsx profile/ links/ recommended/ projects/
                     experience/ education/ technologies/ contact/ resume/ api/upload/route.ts
    api/             terminal-content/route.ts  revalidate/route.ts
    sitemap.ts robots.ts manifest.ts icon.svg
  proxy.ts           locale negotiation + admin gate (middleware.ts in older majors)
  components/        layout/ sections/ portfolio/ tech-cloud/ window-manager/ terminal/ admin/ ui/
  lib/
    content/         schema.ts repository.ts index.ts sanity/ fixtures/
    auth/            session.ts password.ts rate-limit.ts guard.ts
    seo/             metadata.ts json-ld.ts
    terminal/        parser.ts commands/{public,secret}/ vfs.ts completion.ts history.ts output.ts
  i18n/  stores/  styles/globals.css  env.ts
sanity/schema/       optional Studio-ready type definitions (not wired into the app)
messages/            en.json pt.json
fixtures/            data/ images/ pdf/   (fictional dataset, Appendix A)
scripts/             seed-sanity.ts icons-audit.ts i18n-check.ts check-seo.ts admin-hash.ts
tests/e2e/
docs/                SPEC.md DECISIONS.md ADMIN.md SANITY.md SEO.md ACCESSIBILITY.md ADDING_CONTENT.md
```

## 3. Information architecture

### 3.1 Routes

Public routes live under `[locale]`; the admin area is not localized (§12).

- `/` → negotiated redirect (§6).
- `/{locale}` → Home: server-rendered sections (§3.3).
- `/{locale}/projects` → index of all visible projects with the kind filter and server-side pagination (12 per page, crawlable `?page=` links).
- `/{locale}/projects/{slug}` → project detail. Known slugs are prerendered; `dynamicParams` stays on so projects created in the admin work without a redeploy; an unknown slug returns a real HTTP 404; a slug listed in `previousSlugs` answers a 308 redirect to the current URL.
- `/{locale}/accessibility` → short localized accessibility statement.
- `/{locale}/resume` → route handler redirecting (307) to the current résumé PDF for that locale (a Sanity file asset); 404 when absent.
- Localized `not-found` (HTTP 404) and `error` pages, terminal-flavored (‘404 — command not found’, with links home).
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `icon.svg`, `apple-icon`, and per-page `opengraph-image` / `twitter-image` (§13).
- `/api/terminal-content` (public read-only JSON snapshot for the terminal, `noindex`) and `/api/revalidate` (webhook, signature-protected, optional): §11.
- `/admin/**` (gated, §12). No link to it exists anywhere on the public site.

### 3.2 Header and navigation

- Fixed, 64px high (56px on mobile). Transparent at the top; after 24px of scroll becomes `bg-0` at 70% + backdrop blur + hairline bottom border (solid fallback when `backdrop-filter` is unsupported).
- Left: JM monogram (SVG, gradient) + wordmark ‘Julio Muller’ (wordmark hidden below 400px, and while the hero is on screen since the H1 already shows the name; D67); links to `#top`.
- Nav: About · Stack · Work · Résumé · Contact (localized). The active section is highlighted by an indicator that slides between items (Motion `layoutId`), driven by IntersectionObserver (`rootMargin: '-40% 0px -55% 0px'`). Quote, Summary and Recommendations stay off the primary nav.
- Right: `header` featured-link icons (from `md`; inside the mobile menu below), language switcher (segmented `EN | PT`, §6) and a primary terminal button with a visible ‘Terminal’ label (icon-only from `md` to `lg`; accessible name ‘Toggle terminal’) whose tooltip shows the keyboard shortcut (§9). D67.
- Mobile (<768px): hamburger opens a full-screen overlay, large links with staggered entrance; focus trap, Esc closes, body scroll locked only while open, closes on navigation.
- First focusable element: ‘Skip to content’ link.
- On project pages the nav links point to `/{locale}#section` and a ‘Back to work’ link is shown.
- 2px gradient scroll-progress bar fixed at the very top.

### 3.3 Home sections (in order)

1. **Hero** (`#top`). Server-rendered. Content: the profile photo with art direction — `profile.photo` (square) below `lg` in an accent-ring frame with LQIP; optional `profile.photoLg` (3:4) from `lg` up, frameless and fluid (`clamp(18rem, min(35vw, height budget × ¾), 31.5rem)`), alpha blending into the hero (no card, fill or ring); both through `getImageProps` + `<picture>` so one source downloads; `priority` for LCP; monogram fallback when no photo exists. Eyebrow chip (`jobTitle` only, `lg+`, anchored to the portrait with a hairline into the opaque figure; below `lg` the job title is a small line above the H1), H1 (`displayName` on one line that never wraps or clips, in the profile's `titleFont` or Geist; D67), lead paragraph (`heroLead`, max 120 characters) and CTAs (primary ‘See my work’ → `#work`, secondary ‘Get in touch’ → `#contact`). Animated background (§5). A scroll cue that fades on scroll and targets `#quote` when a featured quote exists, otherwise `#about`.
2. **Quotes of the moment** (`#quote`). Full-width pull-quote band showing `featuredQuote` (eyebrow heading, large type, gradient quote mark, optional attribution) as semantic `figure` / `blockquote` / `figcaption`. Hidden when empty. Still a single quote; no CMS array.
3. **About** (`#about`). `bio` as 2–3 short paragraphs on the left; up to 4 count-up metrics (`metrics`) on the right from `lg`. The stats list keeps `id="summary"` so `#summary` still lands here. Facts (`location`, `spokenLanguages`, `focus`) are not rendered in this section.
4. **Stack** (`#stack`). §7, fed by `technology` and `practice` documents.
5. **Work** (`#work`). Featured projects only (`featured` and `visible`, ordered, max 6) as cards (§8.3), plus an ‘All projects’ link to `/{locale}/projects`.
6. **Résumé** (`#resume`). Contracted career block. Native radio tabs switch Experience and Education (both panels stay in the DOM; CSS `:has()` shows the selected one, so it works without JavaScript). Experience is a vertical timeline from `experience` documents (current first): role(s) with dates (`<time datetime>`), company (text only, no logos), location, 2–3 outcome bullets, stack chips. Every job is a native `<details>`; the current role (`end` empty) starts open. Education and certifications are compact cards from `education` documents. Persistent CTAs: résumé PDF (current-locale first, the other language secondary) and the owner’s LinkedIn (`isOwnProfile` and url/id containing `linkedin`). Hashes `#experience` and `#education` land on the matching pane. `collapsedByDefault` remains in the schema but does not drive this UI.
7. **Contact** (`#contact`). `ctaHeading` and `ctaText` from the `contact` document. Primary action: email with a copy-to-clipboard button (toast ‘Copied’) and a `mailto:` link. Then featured links with `contact` placement, the résumé download (current-locale PDF first, the other language secondary), an optional booking-link button and, only if `showPhone` is on, a `tel:` link. No form. The email address is assembled client-side from parts to deter scrapers, with a `<noscript>` fallback ‘name \[at\] domain \[dot\] com’. The phone number is never included in structured data, metadata or the terminal.
8. **Worth following** (`#recommended`). Recommended profiles (people the owner recommends): cards with avatar, name, role, a one-line note and an external link (new tab, `rel='noopener noreferrer'`, accessible name ‘{name}: visit profile (opens in a new tab)’). The heading is localized in the message catalogs (English: ‘Worth following’). Hidden when none are visible.
9. **Footer.** © year, ‘Designed and built by {name}’, featured links with `footer` placement, a link to the accessibility page, the motion-pause toggle (§14.4), back-to-top, a hint to the terminal.

## 4. Design system (dark only)

### 4.1 Principles

Dark, calm, precise. Near-black with a cool undertone, hairline borders, generous space, one restrained gradient accent (violet → cyan) used for emphasis only: the hero accent phrase, active states, focus and hover glows, the progress bar. Never a full-page gradient. Mono type for labels and technical flavor; sans for reading. Authenticity over decoration.

### 4.2 Tokens

Define in `globals.css` via `@theme`, and set `color-scheme: dark`, `<meta name='color-scheme' content='dark'>` and `<meta name='theme-color' content='#07080b'>`.

```css
@theme {
  --color-bg-0: #07080b;       /* page */
  --color-bg-1: #0c0e13;       /* alternate sections */
  --color-surface-1: #11141b;  /* cards */
  --color-surface-2: #171b24;  /* raised, chips */
  --color-line: rgb(255 255 255 / 0.08);
  --color-line-strong: rgb(255 255 255 / 0.16);
  --color-text-1: #e8eaf0;     /* headings, primary text */
  --color-text-2: #a3a9b8;     /* body secondary */
  --color-text-3: #7a8196;     /* meta; still >= 4.5:1 on bg-0 */
  --color-accent-1: #8b7cff;   /* violet */
  --color-accent-2: #4cc9f0;   /* cyan, focus ring */
  --color-term-green: #4ade80; /* terminal prompt and success */
  --color-warn: #fbbf24;
  --color-danger: #f87171;
  --gradient-accent: linear-gradient(120deg, #8b7cff 0%, #4cc9f0 100%);
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px;
  --ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Every text/background pair MUST reach WCAG AA (4.5:1 body, 3:1 large and UI). Verify programmatically in a unit test over the token pairs. Z-index scale as tokens: header 40, floating UI 50, terminal window 60, dock chip 70, mobile menu 80, toast 90.

### 4.3 Typography

- Geist for display and body; JetBrains Mono for terminal, eyebrows, chips and code-like labels (ligatures off in the terminal).
- Fluid scale with `clamp()`: display `clamp(2.5rem, 1.6rem + 4.4vw, 5.5rem)` / 1.02 / weight 600 / tracking -0.035em; h2 `clamp(1.875rem, 1.3rem + 2.4vw, 3.25rem)` / 1.1; h3 1.25–1.5rem; body 1rem/1.7 (1.0625rem from 1024px); small 0.875rem; mono label 0.75rem uppercase, tracking 0.08em.
- Max line length 68ch. `text-wrap: balance` on headings, `pretty` on paragraphs. `font-display: swap` with metric-adjusted fallbacks to avoid CLS.

### 4.4 Layout and surfaces

- Container `min(1200px, 100% - 2 * clamp(1rem, 4vw, 2rem))`; section vertical padding `clamp(4.5rem, 9vw, 8rem)`; breakpoints 480 / 640 / 768 / 1024 / 1280. Mobile-first.
- Section header pattern: mono eyebrow with number (‘01 — About’), h2, optional lead.
- Card: `surface-1`, 1px `line` border, radius 16, inner top highlight `inset 0 1px 0 rgb(255 255 255 / 0.04)`. Glass (header, window): `bg-1` at 70% + `backdrop-filter: blur(16px)`.
- A very subtle noise overlay (inline SVG data URI, about 3% opacity) over the page background to prevent banding.
- Respect safe-area insets (`env(safe-area-inset-*)`) for fixed bottom UI; `viewport-fit=cover`.

### 4.5 Core components (`components/ui`)

`Button` (primary: solid `text-1` on `bg-0`; secondary: outline; ghost; min height 44px; focus-visible ring 2px `accent-2` with 2px offset), `Chip`, `Badge`, `SectionHeader`, `Reveal`, `Card` (with spotlight), `Tooltip`, `Toast`, `Dialog` (native `<dialog>`), `Kbd`, `Icon`. Each is fully typed, accessible and has a short usage example in a Storybook-free `/dev/ui` page (excluded from production build and sitemap).

## 5. Motion and interaction

**Principles.** Motion explains hierarchy, state and depth; it never decorates at the cost of legibility or performance. Animate `transform` and `opacity` (and `filter` sparingly); never animate layout properties except through Motion layout animations. Durations: micro 120–200ms, component 250–400ms, section reveals 500–700ms. Default easing `--ease-out-expo`; springs (stiffness about 300, damping about 30) for window and drag interactions. Stagger 50–70ms. Everything MUST respect reduced motion (`useReducedMotion` and `@media (prefers-reduced-motion: reduce)`): no parallax, no auto-rotation, no looping animation, no typewriter; state changes become instant or cross-fades.

**Movement inventory (all MUST unless marked).**

1. **Hero background.** An ‘aurora’ of 2–3 blurred gradient blobs drifting on 30–40s CSS keyframe loops, a faint 48px grid with a radial mask, and a pointer-following spotlight (radial gradient, position eased in rAF, fine pointers only). Paused when the hero leaves the viewport. Static for reduced motion.
2. **Hero headline.** Word-by-word masked reveal on load (60ms stagger); rotating role word (vertical slide, 2.6s cadence). Screen readers get the static sentence through `aria-label`; the rotating span is `aria-hidden`.
3. **Scroll reveals.** `Reveal` wrapper: fade + 16px rise once at 20% visibility, staggered inside groups. Content MUST be fully visible without JavaScript (SSR renders visible; the animation attaches after hydration without a flash).
4. **Scroll progress** bar (§3.2).
5. **Experience timeline.** The vertical line draws with scroll (scaleY from scroll progress); each node pulses once when reached.
6. **Counters.** Summary metrics count up once in view, `Intl`-formatted; jump to the final value for reduced motion.
7. **Cards.** Pointer-tracked spotlight border (CSS variables `--mx`/`--my`) and a maximum 6° tilt only under `(hover: hover) and (pointer: fine)`; cover image zooms 1.04 on hover.
8. **Buttons.** Primary CTA gets a magnetic pull (max 8px, fine pointers only); arrow icon nudges on hover; press scale 0.98.
9. **Active nav indicator** (§3.2).
10. **Route transitions.** Cross-fade between routes. SHOULD use the View Transitions API (progressive enhancement) to morph a card cover into the detail hero if the installed Next.js supports it stably; otherwise skip and note it in DECISIONS.
11. **Tech cloud and window manager.** §7 and §9.

Native `scroll-behavior: smooth` guarded by reduced motion; `scroll-margin-top: 80px` on sections. Hard cap: no more than 3 looping animations running in the viewport at once.

## 6. Internationalization

- **Locales:** `en` (default) and `pt`. The URL segment is `pt`; the BCP-47 tag used in `<html lang>`, hreflang and `og:locale` is `pt-BR` (`pt_BR` for Open Graph). Always prefix (`localePrefix: 'always'`). Same slugs in both locales (no localized pathnames).
- **`/` negotiation:** saved preference (`NEXT_LOCALE` cookie, set only when the visitor explicitly switches language) → `Accept-Language` → `en`. Requests without `Accept-Language` (crawlers) get `en`. The redirect is temporary (307).
- **Setup:** next-intl routing and navigation helpers; `generateStaticParams` for locales; `setRequestLocale` in every layout and page to keep prerendering; typed messages through module augmentation so missing keys fail typecheck.
- **UI strings** live in `messages/{en,pt}.json`, namespaced by feature (`header`, `hero`, `quote`, `summary`, `about`, `resume`, `stack`, `work`, `project`, `recommended`, `contact`, `footer`, `terminal`, `a11y`, `errors`). No user-facing string may be hard-coded in a public component, including aria-labels, alt text, tooltips, toasts and terminal output. Exceptions: the admin UI is English-only (its content fields are bilingual), and the secret-command flow (§10.6) keeps its strings inside its lazy module.
- **Content** comes from Sanity as field-level localized objects `{ en, pt }` (§11). The data layer resolves one locale at its boundary, falling back to `en` when the `pt` value is empty and logging a content warning; components never see the raw object.
- **`pnpm i18n:check`** MUST verify identical key sets in the message files, no empty values, matching ICU placeholders, every localized field of the fixtures dataset filled in both languages, and report values identical in EN and PT (probably untranslated) except an allow-list of proper nouns. Runs in CI.
- **Language switcher:** segmented control built from real links with `hreflang` and `lang` attributes (works without JS); preserves path, query, hash and approximate scroll position; announces the change politely; the terminal `lang` command uses the same mechanism.
- **Formatting** through `Intl` and next-intl formatters (dates, numbers, lists); never hard-code locale-specific formats.
- **SEO for both languages:** §13.6. Copywriting rules: §17.

## 7. Technology cloud (`#stack`)

**Concept.** A 3D sphere of technology logos that rotates slowly, can be dragged, pauses on hover or focus, and reveals the technology name on hover (desktop) or tap (touch). It communicates breadth, never proficiency. The section heading is a localized message (English: ‘Technologies I work with’), not ‘skills’.

**Data.** Technologies are Sanity documents of type `technology` (§11.2), editable in the admin area. The data layer returns this shape, with icon data already resolved on the server so the browser never needs an icon package:

```ts
type TechCategory = 'language' | 'frontend' | 'backend' | 'data' | 'cloud' | 'integration' | 'ai';
interface Technology {
  id: string;                       // Sanity _id
  name: string;                     // proper noun, never localized
  category: TechCategory;
  icon: { viewBox: string; paths: string[] } | { monogram: string };   // resolved on the server
  brandColor?: string;              // hex; used on hover only, after luminance correction
  url?: string;                     // official site (https)
  priority: 1 | 2 | 3;              // 1 = always in the cloud; 3 = list view only on small screens
  order: number;
}
```

Stored fields add `iconSource` (`simple-icons` | `devicon` | `custom-svg` | `monogram`), `iconSlug`, `customSvg` and `visible`. Icon resolution happens on the server: Simple Icons and Devicon slugs are looked up in their packages, a custom SVG is parsed and sanitized (§12.7) into a `viewBox` and `d` attributes, and a monogram is generated from the name.

Practices and concepts without logos (Clean Architecture, SOLID, DDD, microservices, microfrontends, observability, CI/CD, design systems, spec-driven development, LLMs, API design, payment systems) are Sanity `practice` documents (localized label, order, visibility), rendered only in List view as text chips.

**Sphere algorithm (custom, DOM-based).**

- Points on a Fibonacci sphere: for i in \[0, n-1\], `y = 1 - 2i/(n-1)`, `r = sqrt(1 - y²)`, `θ = i·π·(3 - √5)`, `x = r·cos θ`, `z = r·sin θ`.
- Rotation lives in a mutable ref (angles + angular velocity). One `requestAnimationFrame` loop applies the rotation matrix and writes `transform`, `opacity` and `z-index` directly to elements through refs. **No React state updates per frame.**
- Projection: perspective factor `p = f / (f - z·R)` with f ≈ 2.2R; scale 0.6 → 1.1 and opacity 0.25 → 1 mapped from depth z ∈ \[-1, 1\]. Items with z < -0.25 get `pointer-events: none` so hidden icons cannot steal hover.
- Delta-time based (frame-rate independent). Base auto-rotation about 0.12 rad/s around a slightly tilted Y axis; drag adds inertia (damping ≈ 0.94 per 16ms) and eases back to the base speed.
- The loop runs only while the section is in the viewport and the tab is visible (IntersectionObserver + `visibilitychange`); full cleanup on unmount.
- Sizing: square container `min(560px, 100%)`, radius ≈ 42% of it, icon box 44px (36px under 640px), responsive through ResizeObserver.
- Density: from 640px up render all priorities; below 640px render priorities 1–2 only (about 36 items) to avoid crowding.

**Interaction.**

- **Hover or keyboard focus on an icon:** rotation eases to a stop (≈300ms), the icon scales ×1.25, turns from neutral to its brand color and gets a soft glow. A tooltip above shows name + localized category. Rotation resumes 400ms after the pointer leaves.
- **Drag:** Pointer Events with `setPointerCapture`; horizontal drag → yaw, vertical → pitch (mouse and pen only). Use `touch-action: pan-y` so vertical page scrolling keeps working on touch and only horizontal swipes rotate the sphere.
- **Tap (touch):** movement < 6px and duration < 250ms selects the icon (no navigation), freezes rotation and shows its name in a persistent caption under the sphere (`aria-live='polite'`) plus a tooltip. Tapping elsewhere deselects; rotation resumes 2.5s after the last interaction. The caption offers a small ‘Official site ↗’ link (`rel='noopener noreferrer'`, new tab).
- **Category chips** (Languages, Frontend, Backend & APIs, Data & messaging, Cloud & DevOps, Integrations & automation, AI agents & tooling, each with a count) highlight matching logos and fade unmatched ones (~8% opacity, ~250ms ease, no pointer events, no hover name). Selecting again clears. Cloud view only, centered. Navigation aid only, no ranking.

**Visual treatment.** Logos are inline SVG in `currentColor`: neutral `text-2` at 70% opacity by default, so dark brand marks (GitHub, Next.js, Express) stay visible on near-black. On hover, focus or selection use `brandColor`, except when its relative luminance is below 0.25 (then use `text-1`). A faint radial glow sits behind the sphere. No boxes or borders around icons.

**Accessibility and fallbacks.**

- There is no Cloud | List control. The List view is the accessible representation: a grouped `<ul>` per category with logo + name, then the practices chips. It is the default when `prefers-reduced-motion` is set (or Pause animations), and the server-rendered baseline when JavaScript is unavailable.
- The sphere wrapper is `aria-hidden='true'` for assistive technology; its items have `tabindex='-1'`. Reduced-motion is the only view switch.
- Names and categories never rely on color alone.

**Performance.** The sphere chunk loads lazily as the section nears the viewport (`next/dynamic` + IntersectionObserver, 300px root margin) behind a same-size placeholder (no CLS). All SVG paths are static data: no network requests.

## 8. Portfolio (`#work` and detail pages)

### 8.1 Data model

```ts
type ProjectKind = 'web' | 'mobile' | 'desktop' | 'automation' | 'integration' | 'open-source';
type ProjectStatus = 'live' | 'in-progress' | 'archived' | 'private';
interface ImageRef {
  url: string; width: number; height: number;
  lqip: string;                        // base64 blur placeholder from Sanity metadata
  alt: string;                         // required, localized
  focal?: { x: number; y: number };    // 0–1 focal point for cropping
}
interface Project {                     // as returned by the data layer for ONE locale
  id: string; slug: string;
  previousSlugs: string[];              // old slugs; the route answers 308 to the current one
  featured: boolean; visible: boolean; order: number;
  year: number; kind: ProjectKind; status: ProjectStatus;
  techIds: string[];                    // must reference existing technologies
  cover?: ImageRef;                     // 16:10 recommended; omit to use the generated cover
  gallery: (ImageRef & { caption?: string })[];
  links: { live?: string; repo?: string };
  title: string;
  tagline: string;                      // one line, <= 90 chars
  summary: string;                      // card description, <= 160 chars
  role: string; context: string; approach: string;
  highlights: string[];                 // 3–5 outcome bullets
  outcome?: string;
  body?: string;                        // Markdown (GFM) for the expanded page
  updatedAt: string;                    // Sanity _updatedAt, used for sitemap lastmod
}
```

Validation (zod, applied on read and on write, §11.4): unique and well-formed slugs, existing `techIds`, https-only URLs, both locales filled, length limits, required alt text on every image, and exclusion of hidden items from every public output. Localized fields are stored as `{ en, pt }` objects (§11.2) and resolved to one locale by the data layer.

### 8.2 Seed content

Everything is fictional for now. Seed (fixtures and `pnpm sanity:seed`) the projects defined in Appendix A: they cover every kind, include featured and hidden items, projects with and without a live URL, one with a long Markdown `body` and a gallery, and one with `previousSlugs` to exercise redirects. Use invented names and `example.com` URLs only.

### 8.3 Card (`ProjectCard`)

Top to bottom: cover (16:10) with a kind badge (top-left) and status dot (top-right); title (h3); description (`summary`, clamped to 3 lines); stack chips (max 4 + ‘+N’); footer with CTAs.

- **CTA 1 — ‘Visit app ↗’**: rendered only if `links.live`; opens a new tab with `rel='noopener noreferrer'`; accessible name ‘Visit {title} (opens in a new tab)’.
- **CTA 2 — ‘View details →’**: always rendered; internal link to `/{locale}/projects/{slug}`. When CTA 1 is absent, CTA 2 becomes the primary button. Cards in a row keep equal height and their footers align to the bottom, so the layout never shifts.
- The whole card is clickable via the stretched-link pattern on CTA 2 (`::after` covering the card) while CTA 1 sits above it. No nested interactive elements; one tab stop per CTA.
- Hover (fine pointers): spotlight border + tilt (§5.7), cover zoom, slight lift. Focus-visible: ring on the card.
- Cover: `next/image` (AVIF/WebP) with correct `sizes`; `priority` only for the first row on desktop. With no cover, render `GeneratedCover`: deterministic abstract art (gradient + grid + a kind-specific glyph) seeded from the slug, so nothing looks empty and no proprietary UI is exposed.
- Grid: 1 column below 768px, 2 columns from 768px, 3 columns from 1100px; 24px gap.

### 8.4 Filter

Chips above the grid on `/{locale}/projects` (the Home page shows featured projects only and has no filter): All · Web · Mobile · Desktop · Automation · Integrations · Open source. Show only kinds with at least one visible project, with counts; hide the filter entirely when only one kind exists. Single-select (`role='radiogroup'`), state in the URL query (`?kind=web`), animated reflow (Motion `layout` + `AnimatePresence`) and a polite live region announcing ‘Showing N projects’. The grid is server-rendered, so the filter MUST work without JavaScript as plain links; filtered URLs carry `noindex, follow` and a canonical pointing to the unfiltered page (§13.1).

### 8.5 Detail page `/projects/{slug}`

- **Hero:** breadcrumb (Home › Work › Title) as a visible list with structured data, `h1`, tagline, meta row (year, kind, status, role), CTAs (Visit app ↗ if live; Repository ↗ if repo; Back to work) and the cover inside a minimal browser/device frame chosen by `kind` (decorative chrome is `aria-hidden`).
- **Body:** two columns with a sticky meta aside from 1024px: Context, Approach, Highlights (list), Outcome (if any), the expanded **`body`** (Markdown, safely rendered on the server, §12.8; this is the dedicated, editable long-form content of the page), Technologies (chips with the same icons as the cloud) and Gallery.
- **Gallery:** responsive grid of `next/image` thumbnails (captions and alt text from Sanity) opening a native `<dialog>` lightbox with arrow-key and swipe navigation, Esc to close and focus restored to the trigger. Hidden when there is no gallery.
- **Related projects:** up to 3 other visible projects ranked by shared technologies, followed by previous / next navigation (by `order`, wrapping), as cards. This strengthens internal linking.
- `generateMetadata` per locale and slug, JSON-LD and OG images per §13.
- Known slugs are prerendered; `dynamicParams` stays on; an unknown slug returns 404; a `previousSlugs` match returns a 308 to the current slug.

### 8.6 Index page and featured logic

`/{locale}/projects` lists every visible project, featured first and then by `order`, 12 per page with crawlable pagination (`?page=2`, self-referencing canonical per page), the kind filter (§8.4), an `h1` and an intro paragraph from the message catalogs. The Home page shows projects where `featured && visible`, in `order`, capped at 6 (the admin warns when more than 6 are flagged). A project with `visible: false` is invisible everywhere (pages, sitemap, terminal, search engines) but stays in Sanity.

## 9. Window manager (generic OS-style windows)

Build a small, reusable window system. The terminal is its first and only window, but nothing in the manager is terminal-specific.

### 9.1 Model (Zustand)

```ts
interface WindowState {
  id: string; title: string;
  status: 'closed' | 'open' | 'minimized';
  maximized: boolean;
  rect: { x: number; y: number; width: number; height: number };   // restored geometry, px
  zIndex: number; focused: boolean;
}
```

Actions: `open`, `close`, `minimize`, `restore`, `toggleMaximize`, `focus` (raise via an incrementing z counter), `moveTo`, `resizeTo`, `snap(side)`. Geometry is clamped to the viewport on every change and on window resize.

### 9.2 Behavior

- **Overlay.** `position: fixed`, z-index 60, non-modal. Page scroll and interaction continue underneath: no scroll lock, no backdrop, no focus trap, and pointer events outside the window are never intercepted.
- **Defaults.** First open at the bottom-right with a 24px margin, 640×420 (clamped to viewport minus 48px). Minimum size 360×240.
- **Drag.** By the title bar through Pointer Events + `setPointerCapture`; `touch-action: none` on the title bar; `user-select: none` while dragging. During the gesture apply `transform: translate3d` (no layout thrash) and commit to the store on `pointerup`. Clamp so at least 96px of the title bar always stays visible and never slides under the header. Double-click on the title bar toggles maximize.
- **Resize.** 8 handles (4 edges, 4 corners), 6px hit areas (12px on touch), proper resize cursors, minimum size respected, opposite edge anchored. Applied in rAF, committed on release.
- **Edge snapping (SHOULD).** Dragging the pointer to the top edge previews and maximizes; left and right edges snap to half width. A translucent preview rectangle fades in while snapping is armed.
- **Maximize / restore.** Animates to fill the viewport below the header offset (inset 0 on mobile) and back to the previous rect.
- **Minimize.** Animates (scale + translate + fade, ≈280ms spring) toward the dock chip, keeping the session state alive while hidden. **Restore** animates back from the chip.
- **Close.** Ends the session (clears output, keeps command history) with a scale-out. Reopening shows the boot banner again.
- **Focus and stacking.** Pointer-down anywhere on the window focuses it (raises z-index, focuses the terminal input). Clicking the page blurs it: the title bar dims to the inactive style and the caret becomes a hollow block.
- **Dock chip.** Fixed at the bottom-right (above the safe-area inset): a pill `>_ terminal`. Closed state is plain; minimized state shows a small activity dot. Click toggles open / restore / minimize. On the first visit it shows a one-time hint ‘Try the terminal: type help’ for 6 seconds (once per session; skipped for reduced motion or after any interaction).
- **Keyboard.** Global shortcut **Ctrl/Cmd + /** toggles the terminal (closed → open and focus the input; open and focused → minimize). It was chosen because `/` is available unshifted on Brazilian ABNT2 keyboards, unlike the backtick. Keep it as a single constant `TERMINAL_SHORTCUT`, list it in `help`, tooltips and the footer, and never trigger it while the user types in another input or textarea outside the terminal. For accessible moves (WCAG 2.5.7): with the title bar focused, Arrow keys move the window 16px (Shift = 64px) and Alt+Arrows resize by 16px; the maximize/restore buttons are the no-drag alternative.
- **Persistence.** `sessionStorage['jm.window.terminal.v1']` holds status, maximized and rect. Rehydrate after mount (avoid hydration mismatch) and re-clamp to the current viewport. The window lives in `[locale]/layout.tsx`, so client-side navigation (Home ↔ project pages, language switch) neither unmounts it nor loses the session.
- **Mobile (< 640px).** The window becomes a bottom sheet: full width, up to 70dvh, rounded top corners, not freely draggable or resizable. A grab handle toggles between 45dvh and 85dvh; minimize and close remain. It tracks `visualViewport` so the on-screen keyboard never covers the input line. Opening it MUST NOT shift or scroll the page.

### 9.3 Chrome and visuals

Title bar 40px: traffic-light controls on the left (close red, minimize amber, maximize green; 12px dots with a 44px invisible hit area, glyphs appear on group hover or focus), centered title `visitor@julio-muller: ~/projects` (follows the working directory, ellipsis on overflow), nothing on the right. Body: `bg-0` at 88% with a 20px blur, 1px `line-strong` border, radius 14, deep shadow (`0 24px 80px rgb(0 0 0 / 0.55)`), and a faint accent-gradient top edge while focused. All controls are real `<button>` elements with localized accessible names.

## 10. Terminal emulator

A convincing, fast, **fake** shell: no real execution, no `eval`, and no network access from the browser except the first-party snapshot endpoint (§11.7) and the secret authentication calls (§10.6). It is a second interface to the same content as the site (the public content snapshot produced by the data layer) and it drives the site (navigation, scrolling, language). A small hidden part of it is the only door to the admin area (§10.6, §12).

### 10.1 Architecture

- **`src/lib/terminal/` is pure TypeScript** (no React, no DOM) and fully unit-tested: tokenizer/parser, virtual file system, command registry, completion engine, history, output AST.
- **Command contract:**

```ts
interface CommandContext {
  locale: Locale; cwd: string;
  t: (key: string, values?: Record<string, unknown>) => string;
  vfs: VirtualFS;
  content: ContentSnapshot;                        // public, localized snapshot (§11.7)
  auth: { isAdmin: boolean; expiresAt?: number };  // mirrors the server session; a UI hint, never used to authorize
  actions: {
    navigate(href: string): void; scrollToSection(id: string): void;
    setLocale(locale: Locale): void; setCwd(path: string): void; clear(): void;
    downloadResume(locale: Locale): void;
    window: { close(): void; minimize(): void; maximize(): void };
    readSecret(label: string): Promise<string | null>;   // masked input; null when cancelled
  };
}
interface Command {
  name: string; aliases?: string[]; summaryKey: string; usageKey: string;
  visibility: 'public' | 'secret';                 // secret: never in help, completion, suggestions or history
  complete?(ctx: CommandContext, args: string[], partial: string): string[];
  run(ctx: CommandContext, args: ParsedArgs, signal: AbortSignal): Promise<OutputNode[]> | AsyncGenerator<OutputNode>;
}
```

- **Output AST** (never raw HTML strings, which keeps it safe and localizable): `text` (spans with semantic styles `default | dim | bold | accent | success | warn | error | link`), `link` (internal or external), `command` (a clickable chip that inserts and runs a command), `table` (CSS grid, no monospace column math), `tree`, `kv` (key-value list), `ascii` (preformatted, with responsive variants), `spinner`, `blank`. Rendered by `OutputRenderer`; every block has a stable `id`.
- **Parser:** whitespace tokenization with single and double quotes and escapes. `;` chaining, pipes, redirects, globbing and variable expansion are explicitly unsupported and answer with a friendly localized message instead of failing silently.
- **Streaming and abort:** commands may yield output progressively (short simulated delays, 80–250ms) for a lived-in feel. **Ctrl+C** aborts through `AbortSignal` and prints `^C`.

### 10.2 Input and rendering

- **Prompt:** `visitor@julio-muller:<cwd>$` with `~` as home; colors: green user, accent path, dim symbol.
- **Input mechanics:** a hidden native `<input>` captures real typing, IME composition, paste and mobile keyboards. The visible line is rendered as text with a custom block caret mirrored from `selectionStart` / `selectionEnd`. Tapping anywhere in the terminal focuses it. Attributes: `autocapitalize='off' autocorrect='off' autocomplete='off' spellcheck='false' enterkeyhint='send'`. On touch devices the input font-size is 16px to prevent iOS zoom-on-focus.
- **Key bindings:** Enter runs; ←/→ move; Home/End or Ctrl+A/Ctrl+E; Ctrl+U delete to start; Ctrl+K delete to end; Ctrl+W delete word; Ctrl+L clear; Ctrl+C cancel line or abort; ↑/↓ history (the partially typed line is preserved); **Tab** completes commands, subcommands, paths and project slugs, and Tab-Tab lists candidates. A multi-line paste runs only the first line and says so.
- **Quick-action chips bar** above the input: `help`, `projects`, `skills`, `experience`, `contact`, `resume`; horizontally scrollable, each runs its command on click or tap. Essential on mobile, where typing is painful.
- **Output area:** auto-scrolls on new output unless the user scrolled up; capped at 500 blocks (oldest dropped); selectable text; real anchors for links; monospace 13px (12px under 480px width), line-height 1.55.
- **Boot:** compact hand-made ASCII banner (max 6 lines, 46 columns, with a single-line fallback chosen by container width) plus two localized lines, typed in about 900ms. Any key skips it. No boot animation on rehydrate or with reduced motion.

### 10.3 Virtual file system (read-only)

Generated from the public content snapshot (§11.7) for the current locale; file contents are localized when read. Secret commands never appear in the tree.

```text
~
├── about.md
├── contact.md
├── education.md
├── links.md
├── recommended.md
├── resume.pdf              (cat explains it is binary; `open resume.pdf` downloads it)
├── experience/
│   └── <company-slug>.md   (one per visible experience entry)
├── projects/
│   └── <slug>.md           (one per visible project)
└── stack/
    └── <category>.txt      (languages, frontend, backend, data, cloud, integration, practices)
```

`cd`, `ls`, `cat`, `tree` and `open` operate on it. `..`, `~`, absolute and relative paths work. `cat` output uses the same typography as the site copy.

### 10.4 Commands

Every command supports `--help` / `-h` and prints usage from the message catalog. All output is localized.

- **help \[command\]**: grouped list (Navigate, Explore, Site, Fun) with clickable `command` chips; `man` is an alias. It never lists secret commands.
- **about**: short bio and a pointer to `experience`. **whoami** prints `visitor` (or `julio` during an admin session, §10.6).
- **experience**, **education**, **contact** (alias `socials`): career summary; degrees and certifications; email (from the same obfuscated source as the site) plus the featured links.
- **links**: featured links as clickable items. **recommend** (alias `following`): recommended profiles with their notes and links.
- **skills \[--category \<c>\]** (alias `stack`): technologies grouped by category as text chips. **Never** levels or percentages.
- **projects \[--kind \<k>\] \[--featured\]**: table of slug, kind, year and one-line summary. **open \<slug>** (also `projects open <slug>`) navigates to the detail page while the window stays open. `open` also accepts `resume.pdf`, section names and the external URLs of the featured links (new tab).
- **goto \<section>**: scrolls to `about | experience | stack | work | recommended | contact`, navigating Home first when on a project page.
- **resume**: prints a résumé summary; `resume --download` downloads the PDF for the current locale (or says it is not available yet).
- **lang \[en|pt\]**: switches the site language and prints a confirmation; terminal strings follow from then on (earlier output is not retranslated).
- **ls, cd, pwd, cat, tree** per §10.3; **clear** (Ctrl+L), **echo**, **history**, **date**, **uname -a**, **exit** (closes the window), **minimize**, **maximize**.
- **neofetch**: key-value card with a small ASCII mark: name, role, location, spoken languages, focus, a few metrics. Only data from the snapshot.
- **git log --oneline**: renders the career timeline as a commit log (hash-like ids derived from slugs; messages are one-line milestones from the experience entries).
- **Easter eggs (SHOULD, localized, harmless):** `sudo` (permission denied, with a joke; it never grants anything), `rm -rf /` (politely refuses), `vim` / `nano` / `emacs` (a one-liner about leaving the editor), `ping`, `ssh`, `matrix` (green rain inside the terminal body for 4s; skipped for reduced motion), `cowsay <text>`, `fortune` (original short engineering maxims, not quotations).
- **Unknown command:** `command not found: foo`, plus ‘Did you mean `bar`?’ (Levenshtein distance ≤ 2, suggestions drawn from public commands only) and a `help` chip. A secret command typed while it is unavailable produces exactly this output.

### 10.5 Terminal accessibility and quality

- The output region is `role='log'` with `aria-live='polite'` (throttled); the input has a visible, localized label. The terminal is an enhancement: all of its content is also reachable on the page.
- Fully keyboard-operable with visible focus and no keyboard traps; Tab leaves the window naturally after the input.
- Typewriter and streaming delays are disabled for reduced motion (output appears at once).
- Session state (output log up to 300 blocks, command history up to 100 entries, cwd) is persisted in `sessionStorage['jm.terminal.v1']`; command history alone also survives closing the window. **Nothing typed into or produced by a secret command is ever persisted**: not the input, not the output, not the prompt state (§10.6).
- The content snapshot is fetched when the terminal first opens (and prefetched on idle after load) from `/api/terminal-content`. While it loads, content commands show a spinner; on failure they print a friendly error and the rest of the terminal keeps working.
- Unit tests are required for the tokenizer (quotes, escapes, empty input), path resolution, completion, history navigation, each public command’s output against fixtures in both locales, abort behavior, unknown-command suggestions, and the exclusion of secret commands from help, completion, suggestions and history.

### 10.6 Secret commands and the admin session

These commands are the **only** way into the admin area. They are deliberately invisible, but their secrecy is a UX measure, not a security one: every real protection lives on the server (§12).

- **Isolation.** Secret commands live in `src/lib/terminal/commands/secret/` and are loaded with a dynamic import only when the first token of a line matches a secret command name, so the public terminal chunk never contains them. Their names are defined once in `secret/names.ts`. They are excluded from `help`, Tab completion, did-you-mean suggestions, `history`, the virtual file system and the session persistence of §10.5.
- **`su julio`** starts the login. Any other target (`su root`, bare `su`) behaves identically (same prompt, same delay, same failure), so the valid user name is not revealed. The terminal enters **secret-input mode**: it prints `Password:`, echoes nothing (not even asterisks), hides the caret, and reads from a hidden `<input type='password'>` with `autocomplete='off'` and the accessible name ‘Password’. Pasting is allowed (WCAG 3.3.8) and Ctrl+C cancels. The value lives only in a local variable, is never written to the terminal store, history, output log, sessionStorage, console or error reports, and is cleared right after sending.
- The submit calls a Server Action `authenticate(password)` returning `{ ok: true, redirectTo }` or `{ ok: false }`. On failure the terminal prints `su: Authentication failure`: the same text for wrong passwords, rate limiting and lockouts, after an equalized delay (§12.3). On success it prints a short confirmation and switches state.
- **`admin`** (only during an admin session) lists the areas as clickable chips: `profile`, `links`, `recommended`, `projects`, `experience`, `education`, `technologies`, `contact`, `resume`. `admin <area>` navigates to that admin page. Without a session its output is byte-identical to the unknown-command output.
- **`logout`** (only during a session) calls a Server Action that clears the cookie and returns the prompt to normal. Without a session: unknown command.
- **Prompt and chrome during a session.** The prompt user becomes `julio` and the prompt symbol a red `#`; the title bar shows a small `session` pill with the remaining time. On expiry the next command prints `session expired` and the prompt reverts.
- **State.** `auth.isAdmin` is refreshed from the server (`getSessionStatus()` Server Action) on terminal mount, on window focus and before every `admin` command. It is a UI hint only; authorization is enforced on the server for every request.
- **No path leaks.** The admin base path is returned by the server inside `redirectTo`, kept in memory only, and appears in no client bundle, HTML, sitemap, robots file or message catalog (tested, §18).
- **Strings.** All secret-flow strings are English and bundled inside the lazy secret module, not in the public message catalogs (an explicit exception to the i18n rule, so they are not shipped on every page).
- **Tests (unit and e2e):** secret commands are invisible to help, completion, suggestions, history and persistence; the wrong-password flow shows the generic failure and stores nothing; the success flow navigates; `logout` works; unauthenticated `admin` equals the unknown-command output.

## 11. Content platform: Sanity and the data layer

### 11.1 Principles

- Sanity is the single store for all public content, images and files. The app talks to it only from the server, through its HTTP API with a read token and a write token. No credentials, queries or SDK reach the browser, and no Studio is embedded.
- All code goes through a `ContentRepository` interface (`src/lib/content/repository.ts`) with two adapters: **sanity** and **fixtures**. Components, pages, the terminal snapshot, the sitemap and the admin never import Sanity directly. Both adapters MUST pass the same contract test suite.
- `CONTENT_SOURCE` picks the adapter: `sanity` when `SANITY_PROJECT_ID` and `SANITY_DATASET` are set, otherwise `fixtures`. The fixtures adapter serves the fictional dataset (Appendix A) from memory. Outside production it is also writable in memory (writes vanish on restart), so the whole admin can be built and tested without Sanity credentials; in production it is read-only and the admin shows a ‘Demo data, read-only’ badge.
- Recommended dataset setup (document it in `docs/SANITY.md`): a **private** dataset, so hidden items are never readable through the public API; a read token (Viewer) and a write token (Editor) stored as server-only env vars; no CORS origins needed because the browser never calls Sanity. Pin `SANITY_API_VERSION` to a date. Choose `useCdn` per the Sanity docs for authenticated reads and record it in DECISIONS.

### 11.2 Document types

Localized fields are objects `{ en, pt }` (written **L** below). `order` is a number; `visible` is a boolean (default true).

**Singletons** (fixed `_id`):

- `profile`: `displayName`, `jobTitle` (L), `heroLead` (L, max 120), `titleFont?` (one of ten fixed ids, D67), `photo` (image + `alt` L + focal point; square hero / OG), `photoLg?` (image + `alt` L + focal; 3:4 hero from `lg` up; falls back to `photo`), `bio` (L, Markdown, short paragraphs), `location` (L), `spokenLanguages` (× L), `focus` (L), `metrics` (max 4 × `{ value, label L, countTo?, prefix?, suffix? }`), `featuredQuote` (`{ text L, attribution? L }`).
- `contact`: `email`, `phone?`, `showPhone` (default false), `bookingUrl?`, `ctaHeading` (L), `ctaText` (L).
- `resume`: `file.en` and `file.pt` (Sanity file assets) and `updatedAt`.

**Collections:**

- `featuredLink`: `label` (L), `url` (https or `mailto:`), `kind` (`social` | `site` | `other`), `icon` (a Simple Icons slug, a Lucide key or `link`), `placements` (any of `header`, `contact`, `footer`; `header` shows up to three icons), `isOwnProfile` (adds `rel='me'` and feeds JSON-LD `sameAs`), `order`, `visible`.
- `recommendedProfile`: `name`, `role` (L), `note` (L, ≤ 140 chars), `avatar` (image; alt derived from the name), `url` (https), `order`, `visible`.
- `project`: the fields of §8.1 plus `body` (L, Markdown), `gallery` (images with L alt and caption), `previousSlugs`, `featured`, `visible`, `order`.
- `experience`: `company`, `companyUrl?`, `location` (L), `roles` (× `{ title L, start 'YYYY-MM', end? 'YYYY-MM', summary L, bullets × L }`), `techIds`, `collapsedByDefault`, `order`, `visible`.
- `education`: `kind` (`degree` | `certification`), `title` (L), `institution`, `start?`, `end?`, `url?`, `order`, `visible`.
- `technology` (§7) and `practice` (`label` L, `order`, `visible`).

### 11.3 Identity and drafts

Singletons use an `_id` equal to their type name; collection ids are `<type>.<uuid>`. There are no drafts: documents are written already published (no `drafts.` ids), and each document’s `_updatedAt` feeds `lastmod` in the sitemap. Seeded documents carry `isFixture: true`.

### 11.4 Validation

`src/lib/content/schema.ts` holds one zod schema per document type, and the TypeScript types are `z.infer` of them (the single contract). Rules: trimmed strings with length caps; https-only URLs (plus `mailto:` for contact and featured links); slugs match `^[a-z0-9]+(?:-[a-z0-9]+)*$` and are unique; every required localized field is non-empty in both languages; every image has non-empty alt text in both languages (avatars derive it); hex colors; `techIds` reference existing technologies; Markdown contains no raw HTML. **On read**, an invalid document is skipped and logged (a page never crashes because of one bad document). **On write**, it is rejected with field-level errors.

### 11.5 Read path

- GROQ projections fetch only what each page needs. Localized fields are projected as `coalesce(field[$locale], field.en)`; images as `asset->{ url, metadata { dimensions { width, height }, lqip } }`. Public queries filter `visible == true` and sort by `order`.
- Fetches use Next’s cache with tags: `content:profile`, `content:contact`, `content:resume`, `content:links`, `content:recommended`, `content:projects`, `content:project:<slug>`, `content:experience`, `content:education`, `content:technologies`, `content:practices`, plus a 24-hour `revalidate` fallback so stale content cannot persist if a revalidation is ever missed.
- Image URLs are rendered through `next/image` (`remotePatterns` for the Sanity CDN host), so browsers only talk to the site’s own origin; the focal point drives `object-position`.

### 11.6 Write path (admin only)

- Every mutation lives in `src/lib/content/sanity/write.ts` (`import 'server-only'`) behind a Server Action that calls `requireAdmin()`, parses the input with zod, writes through a client configured with `SANITY_WRITE_TOKEN` and `useCdn: false` using transactions, applies **optimistic concurrency** (`ifRevisionID` from the `_rev` the form loaded), calls `revalidateTag` for the affected tags (and `revalidatePath` where required, e.g. the sitemap), and returns `{ ok: true }` or `{ ok: false, fieldErrors | conflict }`.
- Deleting a technology referenced by a project or experience entry is blocked and the referencing documents are listed. Hard deletes require typed confirmation in the UI; hiding (`visible: false`) is the soft alternative.
- Assets are uploaded with `client.assets.upload` only after the validation and re-encoding of §12.7.

### 11.7 Terminal snapshot

`GET /api/terminal-content?locale=en|pt` returns a compact public JSON snapshot (about text, experience and education summaries, technologies, projects, featured links, recommended profiles, contact email parts), cached and tag-revalidated like pages, with `X-Robots-Tag: noindex`. Hidden items and phone numbers are never included.

### 11.8 Seed script

`pnpm sanity:seed` is idempotent (`createOrReplace` with stable ids), uploads the generated placeholder images and sample PDFs, tags every document `isFixture: true`, refuses to run against a dataset named `production` without `--force`, and supports `--reset` (deletes only `isFixture` documents, after an interactive confirmation).

### 11.9 Webhook revalidation

`POST /api/revalidate` verifies the Sanity webhook signature with `SANITY_WEBHOOK_SECRET`, maps `_type` (and slug) to tags and revalidates them, covering edits made outside the admin. Rate-limited; any invalid request receives a plain 404.

### 11.10 Optional Studio-ready schemas

`sanity/schema/*.ts` (`defineType`) mirror the zod schemas but are not wired into the app. `docs/SANITY.md` explains how to run Studio separately later.

## 12. Admin area and secret access

### 12.1 Access model

- The only way in is the terminal (§10.6). There is no login page, link, button, sitemap entry or hint anywhere on the public site.
- Any request to `/admin/**` (pages, route handlers, the upload endpoint, Server Action posts) without a valid session returns the **same real 404** as any non-existent path: same HTML, `404` status, comparable timing. Never 401, 403 or a redirect to a login.
- Defense in depth: `src/proxy.ts` gates `/admin/:path*` by verifying the session cookie (a cheap JWT check), and every admin Server Component, Route Handler and Server Action calls `requireAdmin()` again. Never rely on the proxy alone, and never trust client-side state.
- The admin is a separate, non-localized route tree with its own layout (no public header, footer or terminal) and `lang='en'`.
- If `ADMIN_PASSWORD` / `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` is missing or too weak, the admin is disabled: authentication always fails generically and the secret commands behave as unknown commands.

### 12.2 Authentication and session

- Single administrator. The password comes from `ADMIN_PASSWORD` (plaintext, as the owner requested) or, preferably, `ADMIN_PASSWORD_HASH` (a scrypt-encoded hash generated by `pnpm admin:hash`; it wins when both are set). In production the admin refuses to enable with a password shorter than 16 characters and requires a `SESSION_SECRET` of at least 32 random bytes; both are checked once at startup and reported without values.
- Verification: HMAC the candidate and the expected value with `SESSION_SECRET` (this equalizes length) and compare with `crypto.timingSafeEqual`; for hashes use scrypt verification. Never log, echo or return the password.
- Session: a signed JWT (HS256, `jose`) in a cookie named `__Host-jm_session` (plain `jm_session` over http in development), `HttpOnly`, `Secure` (production), `SameSite=Strict`, `Path=/`, no `Domain`. Claims: `sub: 'admin'`, `iat`, `exp`, `jti`; no personal data. Lifetime: 8 hours absolute and 30 minutes idle with sliding renewal (re-issued at most once a minute). Logout clears the cookie. Without a session store individual sessions cannot be revoked; rotating `SESSION_SECRET` invalidates all of them (document this).
- Expiry warning: two minutes before expiry the admin shows an accessible dialog (‘Your session expires soon’) with a ‘Stay signed in’ button backed by a Server Action that renews the session (WCAG 2.2.1).

### 12.3 Brute-force protection

- A `RateLimiter` interface with an in-memory sliding-window default and an optional Upstash Redis adapter used when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set (serverless instances do not share memory; document the limitation).
- Limits: 5 failed attempts per 15 minutes per client (hash of the IP taken from the platform’s trusted header) with exponential backoff and a 15-minute lockout, and a global cap of 30 failures per hour that pauses all attempts. Every denial returns the same generic failure.
- Every authentication response is delayed to a constant minimum of 800 ms plus random jitter, success and failure alike.
- Structured, redacted logs for `auth.fail`, `auth.success` and `auth.locked` (no passwords, no full IPs).

### 12.4 Request integrity

`SameSite=Strict` plus Next’s Server Action origin check, and explicit `Origin` and `Sec-Fetch-Site` verification in every Route Handler that mutates. No state change on GET. Admin responses are `Cache-Control: no-store`.

### 12.5 Non-indexability (search engines, robots and LLM crawlers)

- Every `/admin/**` and `/api/**` response carries `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate` plus the non-standard AI opt-outs `noai, noimageai`; admin responses also send `Referrer-Policy: no-referrer`. The admin layout additionally sets `<meta name='robots' content='noindex, nofollow, noarchive, nosnippet, noimageindex'>` through the Metadata API.
- The admin is never in `sitemap.xml`, never linked, has no `<link rel>` hints, and is absent from the web manifest and every public file. `productionBrowserSourceMaps` stays off.
- **`robots.txt` does not mention the admin path**, because listing it would reveal it. Crawlers that ignore robots rules, including AI crawlers, simply receive a 404, so there is nothing to index or train on; the headers above cover the authenticated case (for example a logged-in browser agent).
- `robots.txt` for the public site: allow everything, reference the sitemap, and `Disallow: /api/` (the admin upload endpoint lives under `/admin/api/`, not `/api/`, so this line reveals nothing).

### 12.6 Admin UI

English-only, responsive, same dark design system (§4), WCAG 2.2 AA, no public chrome. Layout: a sidebar (a bottom tab bar on mobile), a top bar with the session countdown, ‘Sign out’, ‘View site’ and a data-source badge (`Sanity · <dataset>` or ‘Demo data’), and the content area.

Pages (each has a list view and an edit view, bilingual editing, validation and a dirty-state guard):

- **Dashboard** `/admin`: counts per type; a ‘needs attention’ list (fields missing in Portuguese, images without alt text, titles or descriptions outside the SEO length ranges, more than 6 featured projects); recent changes (from `_updatedAt`); ‘Revalidate all public pages’ and ‘Open public site’ buttons.
- **Profile** `/admin/profile`: photo (upload, focal point, alt text), name and title, hero headline, lead and rotating words, bio, facts, metrics, highlighted quote.
- **Links** `/admin/links`: featured links with kind, icon, placements, own-profile flag, order and visibility.
- **Recommended** `/admin/recommended`: recommended profiles (name, role, note, avatar, URL, order, visibility).
- **Projects** `/admin/projects`, `/new`, `/[id]`: searchable table with filters, a featured toggle, a visibility toggle and reordering. The editor covers every field of §8.1 plus the Markdown `body`, gallery, previous slugs and a technology multi-select, with an inline preview that uses the public renderer.
- **Experience** and **Education**: ordered lists with nested role and bullet editors.
- **Technologies** (and **Practices**): list with category, priority, order, visibility and an icon picker (server-side autocomplete over Simple Icons and Devicon slugs, custom SVG upload, monogram fallback) with live preview.
- **Contact** `/admin/contact`: email, optional phone with a ‘show publicly’ toggle (off by default), booking link, CTA texts.
- **Résumé** `/admin/resume`: upload, replace or remove the PDF per language, showing name, size and date.

Shared editor patterns (build once, reuse everywhere):

- `LocalizedField`: EN and PT inputs side by side from 1024px and as tabs below; a per-field completeness badge; a ‘Copy EN → PT’ helper (no machine translation); a warning when both values are identical; character counters with the SEO ranges (title ≤ 60, tagline ≤ 90, summary 70–160, note ≤ 140).
- Markdown editor: a textarea with a keyboard-accessible toolbar (bold, italic, link, list, heading, insert gallery image) and a live safe preview.
- Image field: drag-and-drop or click to upload, preview, focal point picker (click, or arrow keys), required alt text in both languages.
- List editors: add, remove and reorder by drag **and** with up/down buttons.
- A sticky save bar (Save, Discard, dirty indicator), a warning on unsaved navigation, an error summary that receives focus, inline field errors linked with `aria-describedby`, and toasts in a polite live region.
- Concurrency conflicts open a dialog (‘This item changed elsewhere’: Reload or Overwrite). No autosave. Publishing is immediate: saving writes to Sanity, revalidates the affected tags and reports ‘Published · public pages refreshed’.

### 12.7 Uploads and sanitization

- `POST /admin/api/upload` (session required, Origin check, rate-limited) accepts `multipart/form-data`. Limits: images ≤ 4 MB, PDFs ≤ 4 MB (Vercel caps request bodies at 4.5 MB, D-R3). Allowed images: JPEG, PNG, WebP, AVIF, verified by magic bytes, never by extension or declared MIME alone. SVG is never accepted as an asset.
- Images are re-encoded with `sharp` before `client.assets.upload`: apply the EXIF orientation, **strip all metadata including GPS**, cap the longest side at 4000 px, keep alpha. Filenames are normalized. Return the asset id and metadata.
- PDFs must start with `%PDF-`; reject files whose scan finds `/JavaScript`, `/JS` or `/Launch` actions.
- Verify the effective body-size limits of Server Actions and Route Handlers for the installed Next.js version and configure them explicitly.
- **Custom SVG icons** (technologies only) go through a strict allowlist parser: only `svg`, `path`, `g`, `circle`, `rect`, `ellipse`, `line`, `polyline`, `polygon`; strip scripts, styles, event handlers, `foreignObject`, `use` and any external reference; keep only `viewBox` and the geometry attributes; reject anything over 20 KB. Store the result as data (`viewBox` + paths) and render it with React elements, never with `dangerouslySetInnerHTML`.

### 12.8 Markdown rendering (public pages and admin preview)

`react-markdown` with `remark-gfm` and a strict `rehype-sanitize` schema; raw HTML is not rendered; headings are shifted so the page `h1` stays unique and get stable `id`s; external links get `rel='noopener noreferrer'` and open in a new tab; images are allowed only from the project’s own gallery (resolved to Sanity asset URLs through `next/image`); tables scroll inside their own container. Rendered on the server.

### 12.9 Audit and startup checks

Admin writes are logged as structured events (`type`, `id`, `action`, no content bodies). `src/env.ts` validates configuration at boot and reports problems once, without values.

## 13. SEO (maximal)

### 13.1 Rendering and crawlability

- Every public page returns complete, meaningful HTML in the first response (server-rendered or prerendered). Verify with JavaScript disabled: all text, links, headings, images (with alt text), the List view of the tech stack and the project content are present in the HTML.
- Nothing indexable is gated behind interaction or client-side fetching. Accordions use native `details` (content stays in the DOM); the tech sphere is decorative and the List view is the server-rendered baseline.
- Internal navigation uses real `<a href>` links (Next `Link`) with descriptive anchor text and crawlable pagination; no `javascript:` or click-only navigation.
- HTTP semantics: 200 for pages; a real 404 for unknown URLs (never a soft 404); 308 for `previousSlugs` and for canonicalization (no trailing slash, lowercase); 307 only for the `/` language negotiation. Filtered listing URLs (`?kind=`) are `noindex, follow` with a canonical to the unfiltered page; paginated URLs self-canonicalize.
- No duplicate content: exactly one canonical URL per page per language.

### 13.2 Metadata (Next.js Metadata API)

- `metadataBase` from `NEXT_PUBLIC_SITE_URL`; title template `%s | {displayName}`; every page and locale has a unique `<title>` (≤ 60 characters) and description (70–160 characters) derived from Sanity content, with defined fallbacks so neither is ever empty.
- `alternates`: a self-referencing canonical and `languages` for `en`, `pt-BR` and `x-default` (→ `/en`).
- Open Graph (`type: 'website'`, `profile` on Home; `locale`, `alternateLocale`, `siteName`, images with width, height and alt) and Twitter (`summary_large_image`).
- `robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }` on public pages.
- `authors`, `creator`, `publisher`, `category`, `applicationName`, and `formatDetection: { telephone: false, email: false, address: false }`.
- `viewport` export: `width=device-width`, `initialScale: 1`, `viewportFit: 'cover'`, `colorScheme: 'dark'`, `themeColor: '#07080b'`. Never disable user zoom.
- `verification` from `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` when set; icons (SVG, 32px PNG, 180px Apple touch icon) and the web manifest.

### 13.3 Structured data (JSON-LD)

Generated in `src/lib/seo/json-ld.ts` with `schema-dts` types and rendered as one `<script type='application/ld+json'>` per page through a safe serializer that escapes `<`.

- **Home:** `WebSite` (name, url, `inLanguage`, publisher → Person); `Person` with a stable `@id` (name, `jobTitle`, description from the bio, `image`, `url`, `sameAs` = featured links flagged `isOwnProfile`, `knowsAbout` = technologies and practices, `knowsLanguage`, `address` with locality and country only); `ProfilePage` (`mainEntity` → Person, `dateModified`); an `ItemList` of the featured projects. Email and phone are never included.
- **Projects index:** `CollectionPage` + `ItemList` + `BreadcrumbList`.
- **Project detail:** `BreadcrumbList`; `CreativeWork` (or `SoftwareApplication` with `applicationCategory` and `operatingSystem: 'Web'` when `links.live` exists) with `name`, `description`, `url`, `image`, `author` → Person `@id`, `dateModified` (`_updatedAt`), `inLanguage` and `keywords` (technology names). Never add rich-result properties that would be invented (no ratings, no offers).
- Validation: tests parse every block and check required properties, that `@id` references resolve and that URLs are absolute. Manual checks with the Google Rich Results Test and the Schema.org validator are listed in `docs/SEO.md`.

### 13.4 Sitemap and robots

- `sitemap.ts`: every public URL in both languages with `alternates.languages`, `lastModified` from Sanity `_updatedAt` (Home = the newest of everything) and `images` for project covers; hidden items excluded; no `changeFrequency` or `priority` (ignored by Google).
- `robots.ts`: allow all, an absolute `Sitemap:` URL and `Disallow: /api/`. Never block CSS, JS or images. Do not mention the admin (§12.5).

### 13.5 On-page SEO

- One `h1` per page, a logical heading hierarchy, natural keyword usage in titles, headings and lead text, no keyword stuffing.
- Descriptive link text (‘View details about {title}’, never ‘click here’); visible breadcrumbs on `/projects` and detail pages that match the structured data; related projects and previous/next links for internal linking.
- Images: required alt text (both languages), explicit width and height, modern formats through `next/image` (AVIF/WebP), LQIP placeholders, `loading='lazy'` except the LCP image, which gets `priority` and `fetchPriority='high'`.
- External links: own profiles use `rel='me noopener noreferrer'`; other external links use `rel='noopener noreferrer'`.
- Content-quality gates surfaced on the admin dashboard: thin project pages (body under 150 words), missing alt text, titles and descriptions outside range, untranslated fields.

### 13.6 International SEO

Reciprocal `hreflang` annotations in `<head>` and in the sitemap, `x-default` → `/en`, accurate `<html lang>` (`en`, `pt-BR`), localized `og:locale`, crawlable language-switcher links with `hreflang`, no IP-based or cookie-based redirects for crawlers, and genuinely written Portuguese content (§17).

### 13.7 Performance as a ranking signal

Core Web Vitals budgets in §16; `next/font` with `display: swap` and metric-adjusted fallbacks; no render-blocking third-party resources; immutable caching for hashed static assets; compression handled by the host; the LCP element (hero photo or headline) is prioritized.

### 13.8 Social previews

Dynamic `opengraph-image` and `twitter-image` per page and locale (1200×630, dark brand template with title, subtitle and the photo when available), with embedded fonts and a render test.

### 13.9 Monitoring (docs only)

`docs/SEO.md`: Search Console and Bing Webmaster verification through the env tokens, sitemap submission, URL inspection, Rich Results Test, PageSpeed and a launch checklist.

### 13.10 Automated SEO checks

`pnpm check:seo` runs in CI against the production build. It fetches every sitemap URL with JavaScript disabled and asserts: status 200; exactly one `h1`; the title and description length rules; a self-referencing canonical; reciprocal hreflang; parseable JSON-LD; alt text on every `img`; every internal link resolves; no `noindex` on public pages (filtered listings excepted); `noindex` headers on admin and API responses (using a test session for admin); a valid sitemap and robots file; and no occurrence of the admin path in any public HTML. Run `html-validate` over the rendered HTML as well.

## 14. Accessibility (maximal)

Target: WCAG 2.2 AA on every public and admin page, plus AAA criteria wherever they are inexpensive (7:1 contrast for body text: verify the `text-1` and `text-2` tokens, and keep `text-3` at 4.5:1 minimum).

### 14.1 Structure and semantics

- Landmarks (`header`, `nav`, `main`, `footer`, labelled when repeated), a ‘Skip to main content’ link, one `h1`, a logical heading order, `lang` on `<html>` and on any fragment in another language, real lists, tables only for tabular data (with captions and `th scope`), `<time datetime>` for dates.
- Native elements first; ARIA only where semantics are insufficient; accessible names on every icon-only control; `aria-current` for the active nav item and language; decorative SVGs are `aria-hidden`.

### 14.2 Keyboard and focus

- Everything is operable by keyboard in a logical order; no traps except true modal dialogs (focus trap, Esc, focus restored).
- A visible `:focus-visible` indicator (≥ 3:1 contrast, ≥ 2px, with offset) that is never hidden by the sticky header or the terminal window (WCAG 2.4.11: `scroll-padding-top`, and focus scrolling accounts for the header).
- Route changes move focus to the main heading (or to `main` with `tabindex='-1'`) and keep Next’s route announcer; radiogroups (the filter) and the language switcher use roving tabindex.
- Shortcuts use modifiers (WCAG 2.1.4) and are documented.

### 14.3 Pointer and touch

Targets ≥ 44×44 CSS px and never below 24×24 (WCAG 2.5.8). A single-pointer alternative for every drag (2.5.7: window moves, list reordering, focal point). Actions fire on pointer-up and drags can be cancelled (2.5.2); no path-based gestures. Hover or focus content (tooltips) is dismissible with Esc, hoverable and persistent (1.4.13).

### 14.4 Visual and motion

- Contrast: text 4.5:1 (7:1 for body copy), UI components and focus rings 3:1.
- Reflow at 320 CSS px and 400% zoom without two-dimensional scrolling (code and tables scroll inside their containers); text-spacing overrides (1.4.12) never clip; no text in images; orientation never locked.
- Motion: `prefers-reduced-motion` honored; no flashing above 3 per second; any moving content longer than 5 seconds (hero aurora, sphere rotation, rotating words) can be paused (WCAG 2.2.2) through a visible **‘Pause animations’ toggle** in the footer and the header menu, persisted in `localStorage` and applying the same `data-motion='reduced'` state as the media query.
- Also honor `prefers-contrast: more` (stronger borders and text), `forced-colors: active` (system colors; borders and focus rings stay visible; decorative backgrounds removed) and `prefers-reduced-transparency` (blurred glass becomes solid).

### 14.5 Forms and admin

- Visible labels, instructions and format hints; error identification and suggestions in text (3.3.1, 3.3.3); an error summary that receives focus; `aria-invalid` and `aria-describedby`; correct `autocomplete`; no redundant entry (3.3.7).
- Accessible authentication (3.3.8): no cognitive tests, no CAPTCHA, pasting allowed in the secret password prompt. A session-expiry warning with an extension (2.2.1). Consistent help placement (the terminal `help` and a short admin help page).

### 14.6 Dynamic content

Polite live regions for toasts, filter results, the copy confirmation, terminal output and tech-cloud selection captions (4.1.3); `aria-busy` for loading states; no change of content on focus.

### 14.7 Images and media

Informative images have descriptive alt text and decorative ones an empty alt; the lightbox is a proper modal `dialog`; no autoplaying media.

### 14.8 Special components

Terminal: `role='log'`, labelled input, output announced on completion, no per-character announcements. Tech cloud: the List view is the accessible equivalent and the sphere is `aria-hidden`. Window manager: keyboard move and resize, labelled controls. Mobile menu: modal with focus trap and Esc. Language switcher: links with `lang` and `hreflang`.

### 14.9 Verification

- `eslint-plugin-jsx-a11y` (strict) in CI.
- `@axe-core/playwright` with the WCAG 2.0, 2.1 and 2.2 A and AA tags plus best practices: zero violations on every route type, in both locales, with the terminal open, the mobile menu open and the lightbox open, and on every admin page (authenticated).
- Keyboard-only e2e scripts for the primary flows; emulated runs for 200% and 400% zoom, `forced-colors`, `prefers-contrast` and reduced motion; Lighthouse accessibility 100.
- `docs/ACCESSIBILITY.md` with a manual screen-reader checklist (NVDA + Firefox, VoiceOver + Safari on macOS and iOS, TalkBack + Chrome) covering the main flows, and a localized accessibility statement page at `/{locale}/accessibility` (standard targeted, known limitations, feedback contact).

## 15. Security and privacy

- **Headers** (set in `next.config` `headers()` and/or `src/proxy.ts`): a strict **Content-Security-Policy**: `default-src 'self'`; `script-src` without `unsafe-eval` and without a blanket `unsafe-inline`; `style-src 'self'` (add `style-src-attr 'unsafe-inline'` only if inline style attributes, e.g. Motion, require it); `img-src 'self' data: blob:`; `font-src 'self'`; `connect-src 'self'`; `object-src 'none'`; `base-uri 'none'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`. Use the script-allowance mechanism the installed Next.js supports: a hash or SRI approach that keeps public pages statically prerenderable if available; otherwise a nonce-based CSP for admin routes (dynamic anyway) and the least permissive working policy for public pages. Record the trade-off in DECISIONS.
- Also: `Strict-Transport-Security` (`max-age=63072000; includeSubDomains`; add `preload` only after the owner confirms), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (public) and `no-referrer` (admin), a `Permissions-Policy` denying camera, microphone, geolocation, payment, USB and other unused features, `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin`.
- **Secrets:** server-only modules start with `import 'server-only'`; env validation at boot; a CI test greps the production client output for the names and values of the server-only variables (`SANITY_WRITE_TOKEN`, `SANITY_READ_TOKEN`, `ADMIN_PASSWORD`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `SANITY_WEBHOOK_SECRET`) and fails on any hit.
- **Input and output:** zod validation at every boundary (Server Actions, Route Handlers, query parameters); React escaping; sanitized Markdown (§12.8); URL allowlists (`https:`, `mailto:`, and `tel:` only where specified) so `javascript:` and `data:` links are rejected; no `dangerouslySetInnerHTML` except the serialized JSON-LD.
- **No SSRF surface:** the server never fetches URLs supplied by visitors or by admin content.
- **Dependencies:** lockfile committed, `pnpm audit` in CI (fail on high or critical), Renovate or Dependabot configured, build scripts of dependencies restricted to an allow-list.
- **Privacy:** cookieless same-origin Vercel Web Analytics only (page views plus a few custom events: email, résumé, external link, language switch, terminal), no third-party requests, no visitor cookies except the functional `NEXT_LOCALE` (set only on an explicit language switch). The admin session cookie exists only after a successful secret login. EXIF and GPS data are stripped from uploaded images. The email is obfuscated and the phone is opt-in. No personal data is collected from visitors, so no cookie banner is needed. Logs are structured and redacted (no passwords, tokens or full IPs).

## 16. Other non-functional requirements

- **Performance budgets** (mobile profile; Lighthouse CI on Home, one project page and the projects index, in both locales): Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100; LCP < 2.0 s, CLS < 0.05, INP < 150 ms, TBT < 150 ms. Initial JS for Home ≤ 150 KB gzip excluding lazy chunks. The terminal, secret commands, sphere, lightbox and admin are code-split and lazy-loaded; use Motion’s `LazyMotion` with `domAnimation` where possible; public pages never import the admin bundle. Images go through `next/image` with LQIP; no layout shift from fonts, images or lazy components.
- **Browser support:** last 2 versions of Chrome, Edge, Firefox and Safari; iOS Safari 16+. Degrade gracefully without `backdrop-filter`, View Transitions or `dvh` (fall back to `vh`). All reading and navigation works without JavaScript (language switch, project filter, pagination and links are plain links).
- **Robustness:** error boundaries around the terminal, the sphere and the lightbox (a failure never breaks the page: fall back to the List view or a disabled dock chip); localized `not-found` and `error` pages. A Sanity outage at runtime keeps serving cached pages; a Sanity outage at build time fails the build loudly (never publish an empty site).

## 17. Content and copywriting rules

- **Fictional data.** All initial content is fictional (Appendix A) and marked as seed data (`isFixture`). Never put real-looking biographical claims, real companies, real people or real URLs into fixtures: use `example.com`, invented names and invented metrics.
- **Voice:** first person singular, confident, direct, warm; short sentences; concrete outcomes over adjectives; no buzzword soup; no ‘passionate’, ‘rockstar’, ‘guru’ or ‘ninja’; no emoji in copy.
- **English** is the source language. **Brazilian Portuguese** is written natively by a fluent technical writer, never translated literally: natural syntax, first-person verbs, the technical terms Brazilian developers actually say in English kept as they are (deploy, backend, frontend, framework, pipeline, commit), correct accents, and the same meaning as the English text.
- **Localization completeness:** every localized field exists in both languages in the fixtures; `pnpm i18n:check` enforces it (§6).
- **Placeholders:** no lorem ipsum and no ‘TODO’ in rendered text (a test asserts it). Anything the owner must supply later is listed in `docs/ADDING_CONTENT.md`.
- **Résumé files:** Sanity file assets per language, served through `/{locale}/resume`. When a file is missing, hide the download buttons and make the terminal say it is not available yet.
- **Imagery:** no employer logos; the layout works without a profile photo (monogram fallback) and without project covers (generated covers).

## 18. Testing, tooling and CI

- **Unit (Vitest):** the terminal lib (§10.5); window-store geometry, clamping and snapping; sphere math (Fibonacci distribution, projection); zod schemas; repository contract tests run against both adapters; image, PDF and SVG validation (magic bytes, oversize, SVG allowlist, EXIF stripping); auth (password comparison, session sign/verify/expiry, rate limiter, constant-time delay); JSON-LD builders; i18n parity; token contrast; tech-icon audit.
- **Component (Testing Library):** ProjectCard CTA matrix (live + details / details only), filter links, language switcher links, `LocalizedField`, Markdown sanitization (scripts, raw HTML and `javascript:` links are removed).
- **E2E (Playwright; Chromium, WebKit and a mobile viewport):** locale redirect with different `Accept-Language` headers; language switch keeps route and hash; nav active indicator; filter and pagination; card CTAs; detail page, related projects and previous/next; the `previousSlugs` 308; terminal flows (open via chip and shortcut, drag, resize, snap, maximize/restore, minimize/restore, close, `help`, Tab completion, history, `open <slug>`, `lang pt`, persistence across navigation and reload, mobile bottom sheet, reduced motion).
- **Admin e2e** (fixtures adapter, writable in memory): anonymous `/admin` and `/admin/api/upload` return a 404 indistinguishable from a random path; the full secret flow (`su julio` with a wrong password gives the generic failure and stores nothing; the correct password opens a session; `admin` navigates; edit and save, then the public page reflects the change; `logout`); lockout after repeated failures; session expiry; concurrency conflict; upload validation errors; every admin page passes axe.
- **Leak tests:** the production client bundle contains no server-only variable names or values; public HTML and the sitemap never contain the admin path; secret command names are absent from the main terminal chunk; no secret value appears in `sessionStorage`.
- **SEO and accessibility:** `pnpm check:seo` (§13.10) and the axe, keyboard, zoom and forced-colors runs of §14.9; visual snapshots of the hero and cards at 375, 768 and 1440 px.
- **CI** (GitHub Actions, on PR and main): frozen-lockfile install, `lint`, `typecheck`, `i18n:check`, `icons:audit`, `test`, `build`, `check:seo`, `test:e2e`, Lighthouse CI on the built site and `pnpm audit`; cache the pnpm store and Playwright browsers. CI runs with `CONTENT_SOURCE=fixtures` and test-only `ADMIN_PASSWORD` and `SESSION_SECRET` values.
- **Docs to deliver:** `README.md` (what it is, stack, scripts, env vars, deployment), `docs/DECISIONS.md`, `docs/SANITY.md` (project, dataset, tokens, webhook, seeding), `docs/ADMIN.md` (the secret commands, password and hash setup, session behavior, security notes), `docs/ADDING_CONTENT.md`, `docs/SEO.md`, `docs/ACCESSIBILITY.md`.

## 19. Delivery plan (phases and gates)

At the end of every phase: run the gate commands, summarize the results in at most 10 lines, commit, and continue unless a gate is red.

**Phase 0 — Plan (no code).** Read this spec fully. Produce an architecture summary, the resolved library versions (especially Next.js and Tailwind v4), the caching and CSP decisions, a list of risks and assumptions, and any contradictions you found in this spec with how you resolve them. Save to `docs/DECISIONS.md`. Stop and wait for ‘go’.

**Phase 1 — Foundation.** Scaffold (`create-next-app@latest`, `src/app`, TypeScript, Tailwind v4), tooling, `env.ts`, tokens, fonts, next-intl routing and `proxy.ts`, locale layout, header, footer, language switcher, skip link, mobile menu, motion-pause toggle, `.cursor/rules`, CI skeleton, `/dev/ui` page. *Gate:* `lint`, `typecheck` and `build` pass; `/en` and `/pt` render server-side; axe is clean on the shell.

**Phase 2 — Data layer.** zod schemas, `ContentRepository`, the fixtures adapter with the Appendix A dataset and generated images, the Sanity read adapter (GROQ, tags, image projection), the seed script, contract tests, `i18n:check`, `icons:audit`. *Gate:* contract tests pass for both adapters; both locales are complete.

**Phase 3 — Public pages.** Home sections, `/projects`, the detail page, the résumé route, the accessibility page, not-found and error pages, the motion system, and baseline SEO (metadata, JSON-LD, sitemap, robots, OG images). *Gate:* Lighthouse and axe budgets met; `check:seo` green; screenshots at 3 widths reviewed.

**Phase 4 — Technology cloud (§7).** *Gate:* at least 50 fps with 4× CPU throttling; List view; touch behavior verified in mobile emulation; reduced-motion fallback.

**Phase 5 — Window manager (§9).** *Gate:* e2e for drag, resize, snap, maximize, minimize, restore and close; mobile bottom sheet; persistence; keyboard moves.

**Phase 6 — Public terminal (§10.1–10.5).** The lib first with tests, then the UI, then integration (navigate, scroll, language, résumé, snapshot endpoint). *Gate:* unit tests and e2e flows pass; axe with the terminal open.

**Phase 7 — Auth, secret commands and admin shell (§10.6, §12.1–12.5).** Session, password check, rate limiting, proxy gate, the secret module, admin layout and dashboard, 404 behavior, non-indexability headers. *Gate:* the leak tests and the anonymous-404 tests pass.

**Phase 8 — Admin modules and write path (§11.6, §12.6–12.8).** Shared editor components, every admin page, uploads and sanitizers, the Sanity write adapter, revalidation, the webhook. *Gate:* admin e2e on the writable fixtures adapter; a manual smoke run against a real Sanity dataset documented in `docs/SANITY.md`.

**Phase 9 — Hardening.** CSP and security headers, performance pass (bundle analysis, lazy chunks), accessibility pass (§14.9 including the manual checklist), SEO pass (§13), cross-browser pass, Lighthouse CI thresholds enforced, README and docs. *Gate:* Definition of Done.

**Phase 10 — Optional polish (MAY).** View Transitions card → detail, snap preview refinement, more easter eggs, Studio-ready schemas.

## 20. Definition of done and hard don’ts

**Definition of done**

- All phase gates are green in CI; Lighthouse, axe and `check:seo` thresholds are met.
- Every signature feature (§1) works on desktop and mobile, in both languages, and without JavaScript where specified.
- All content flows through the repository interface; the site works with the fixtures adapter and with a real Sanity dataset.
- The admin is invisible to anonymous visitors and crawlers, reachable only through the secret terminal flow, and every admin write refreshes the affected public pages.
- No hard-coded user-facing strings on public pages; `i18n:check` is clean.
- No placeholder text in rendered UI; hidden items never leak into HTML, the sitemap, the terminal or JSON-LD.
- Dark-only; no skill meters.
- Docs are complete, and a new project can be added from the admin by following `docs/ADDING_CONTENT.md` alone.

**Hard don’ts**

- No invented real-world claims; no lorem ipsum; no employer logos; no phone number unless the owner enables it in the admin.
- No light theme or toggle; no skill bars, percentages or stars.
- No Sanity credentials, SDK or queries in client code; no secrets behind `NEXT_PUBLIC_`.
- No admin path in robots.txt, the sitemap, public HTML, client bundles or message catalogs; no 401, 403 or redirect for anonymous admin requests (always the real 404).
- No password in logs, history, storage, console or error reports.
- No third-party runtime requests, trackers or CDNs; no scroll-jacking libraries; no autoplay audio; no flashing above 3 Hz.
- No `any`; no `@ts-ignore` or disabled lint rules without a justifying comment; no JavaScript source files.
- No React state updates per animation frame; no heavy dependency for something achievable in about 100 lines (sphere, lightbox, tooltip).
- No terminal, sphere or filter without reduced-motion and no-JS fallbacks.
- No committed build output or secrets.

## Appendix A — Fictional seed dataset

**Identity (the only real values).** Display name ‘Julio L. Muller’, job title ‘Senior Full Stack Software Engineer’ and city ‘Curitiba, Brazil’, kept in one config file. Everything else below is invented, flagged `isFixture: true`, and every localized field must be written in both English and Brazilian Portuguese (§17).

- **Profile.** Hero headline: ‘Messy problems, reliable software.’ Rotating words: web platforms; mobile and desktop apps; automations; integrations; APIs. Lead: ‘I design and build software end to end, from the first sketch of a data model to the last pixel of the interface. Web systems are where I do my best work.’ Bio in three short paragraphs: who I am (a web-first full stack engineer who also builds mobile and desktop apps, automations and integrations); how I work (untangling messy domains, clean architecture, honest estimates, small teams); what I do beyond code (mentoring, writing notes). Facts: location ‘Curitiba, Brazil’; spoken languages ‘Portuguese (native)’ and ‘English (professional)’; focus ‘Web platforms and APIs’. Metrics: ‘10+’ years building software; ‘40+’ projects shipped; ‘6’ teams led or mentored; ‘99.9%’ uptime on flagship projects. Highlighted quote: ‘Make it work, make it clear, make it kind.’ (an original aphorism, no attribution). Photo: owner-supplied portrait (square + optional 3:4), encoded to WebP by the fixture generator [D47].
- **Experience (3 invented employers).** ‘Lumen Works’, Senior Full Stack Engineer, 2023-03 to present. ‘Northbridge Labs’, Lead Frontend Engineer, 2020-02 to 2023-02. ‘Fable & Co.’, Software Engineer, 2016-06 to 2020-01 (`collapsedByDefault: true`). Each has a summary, 2–3 outcome bullets with invented metrics, and technology references.
- **Education (3).** B.Sc. in Computer Science at ‘Example University’ (2012–2016); two invented certifications from ‘Example Academy’ (2021 and 2022).
- **Technologies and practices.** Seed every item of Appendix C.
- **Featured links (4, `example.com` URLs).** GitHub (social, own profile, hero + footer), LinkedIn (social, own profile, hero + contact), ‘Talks and slides’ (site, contact + footer), one hidden link to prove that visibility works.
- **Recommended profiles (4 invented people, `example.com` URLs, notes ≤ 140 characters).** ‘Ada Sample’ (Staff Engineer, distributed systems), ‘Marco Placeholder’ (Product Designer), ‘Lin Example’ (Developer Advocate), ‘Sofia Demo’ (Data Engineer; hidden). Generated avatars.
- **Contact.** `hello@example.com`; no phone and `showPhone: false`; booking URL `https://example.com/book`; an invented CTA heading and text.
- **Résumé.** A generated one-page sample PDF per language titled ‘Sample résumé (fictional)’.
- **Generated images** (a deterministic script using `sharp`, seeded by slug): authored profile photos encoded to WebP (square 800×800, lg 720×964); avatars 256×256 and project covers/gallery 1600×1000 as abstract gradient-and-grid art; alt text and captions written in both languages.

**Projects (7).** Each has title, tagline, summary, role, context, approach, 3–5 highlights and an outcome, in both languages.

| Slug | Kind | Status | Featured | Links | Notes |
| --- | --- | --- | --- | --- | --- |
| orbit-dashboard | web | live | yes | live | Analytics dashboard concept; long Markdown body (≥ 400 words); gallery of 3 images; 5 technologies |
| pocket-ledger | mobile | in-progress | yes | none | Personal finance app concept; cover only |
| tidy-desk | desktop | archived | no | repo | Cross-platform file organizer concept |
| invoice-bot | automation | private | no | none | Back-office automation concept; no cover (generated cover) |
| pay-bridge | integration | live | yes | live + repo | Payment connector concept; `previousSlugs: ['paybridge']` |
| lint-kit | open-source | live | no | repo | Shareable lint ruleset concept |
| scratch-pad | web | in-progress | no | none | `visible: false`; must never appear anywhere |

## Appendix B — Copy and microcopy (English source; write Portuguese natively)

- **Section headings:** Quotes of the moment; Summary (‘At a glance’); About; Stack (‘Technologies I work with’); Work (‘Selected work’); Résumé (‘Work and education’); Contact; Worth following.
- **Hero:** headline ‘Messy problems, reliable software.’; prefix for the rotating words ‘I build’; CTAs ‘See my work’, ‘Get in touch’, ‘Open the terminal’ and ‘Résumé (PDF)’.
- **Terminal:** welcome line ‘Welcome. This terminal knows everything on this site. Type help to get started.’ Dock hint ‘Try the terminal: type help’.
- **Contact fallback:** ‘Have a hard problem, a product idea or a role in mind? Let’s talk.’
- **Footer:** ‘Designed and built by {name}.’
- **404 page:** ‘404 — command not found’ with a ‘Back to home’ link.
- **Style:** sentence case for headings; buttons start with a verb; no exclamation marks; no emoji; microcopy stays brief.
- Admin strings are English-only and are not part of the message catalogs.

## Appendix C — Technology inventory (priority in parentheses)

These real technologies are the seed set for the `technology` and `practice` documents (fixtures dataset and `pnpm sanity:seed`). Icon sources must be resolved and audited per §2. Names are proper nouns and are not translated.

- **Languages:** JavaScript (1), TypeScript (1), SQL (1), HTML (1), CSS (1), Go (2), Java (2), PHP (2), Python (2), Lua (2), Ruby (3), VBA (3, monogram expected).
- **Frontend:** React (1), Vue.js (1), Next.js (1), Nuxt (2), Zustand (3), TanStack Query / React Query (3), AngularJS (3).
- **Backend & APIs:** Node.js (1), Express (1), GraphQL (1), Fastify (2), NestJS (2), Prisma (2), gRPC (2), Swagger / OpenAPI (3).
- **Data & messaging:** PostgreSQL (1), Redis (1), MongoDB (2), RabbitMQ (2), Google Cloud Pub/Sub (2), BigQuery (2).
- **Cloud & DevOps:** AWS (1), Google Cloud (1), Docker (1), Git (1), GitHub (1), Kubernetes (2), Datadog (3).
- **Integrations & automation:** Okta (2), Stripe (2), SAP (3), Excel / Power Query (3), Power BI (3), SharePoint (3). Some Microsoft marks may be missing from the icon sets: use the monogram fallback.
- **AI agents & tooling:** Cursor (2), VS Code (3), Claude (3), GPT (3, monogram), Gemini (3), Lovable (3).
- **Practices (text chips, List view only):** REST API design, Clean Architecture, SOLID, Domain-Driven Design, microservices, microfrontends, design systems, observability, CI/CD, spec-driven development, LLMs and AI, payment APIs and systems, solution architecture, tech leadership, open source contribution, automation.
- **Mobile and desktop frameworks:** not specified yet. Do NOT seed React Native, Flutter, Electron or similar; the owner will add them through the admin (Technologies) once confirmed.

Priority counts for reference: 18 items at priority 1, 17 at priority 2, 11 at priority 3 (46 total); phones render priorities 1–2 (35 items).
