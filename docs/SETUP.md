# Setup guide

How to run the site locally and how to set up staging (Vercel Preview) and production (Vercel Production) from scratch. Each section can be followed on its own; the [checklists](#checklists) at the end summarize them.

Related guides: [SANITY.md](./SANITY.md) (datasets, tokens, webhook), [ADMIN.md](./ADMIN.md) (password and session), [SEO.md](./SEO.md) and [ACCESSIBILITY.md](./ACCESSIBILITY.md) (launch checks), [ADDING_CONTENT.md](./ADDING_CONTENT.md) (editing).

## Environments at a glance

|                           | Local                             | Staging (Vercel Preview)                       | Production (Vercel Production)   |
| ------------------------- | --------------------------------- | ---------------------------------------------- | -------------------------------- |
| Git branch                | any                               | `next` (and every other non-production branch) | `main`                           |
| URL                       | `http://localhost:3000`           | `https://staging.juliolmuller.com` (suggested) | `https://juliolmuller.com`       |
| Content                   | fixtures, or Sanity `development` | Sanity `development`                           | Sanity `production`              |
| Indexed by search         | no                                | no (`noindex` unless `VERCEL_ENV=production`)  | yes                              |
| HSTS and `__Host-` cookie | no (http)                         | yes (https site URL)                           | yes                              |
| Admin                     | optional                          | yes, its own password and secret               | yes, its own password and secret |
| Access                    | you                               | Vercel Authentication (Deployment Protection)  | public                           |

Rules that hold everywhere:

- **Each environment gets its own secrets**: Sanity tokens, `SESSION_SECRET`, admin password and webhook secret. Then a leaked value can be revoked without touching the others.
- **Only production writes to the `production` dataset.** Local work and previews use `development`. `admin:smoke` and `sanity:seed` refuse `production` (seeding needs `--force`).
- **`NEXT_PUBLIC_SITE_URL` and the security headers are fixed at build time.** After changing any variable in Vercel, redeploy.

## 1. Prerequisites

| Tool    | Version                              | Why                                              |
| ------- | ------------------------------------ | ------------------------------------------------ |
| Bun     | 1.4.x (`packageManager: bun@1.4.3`)  | package manager and the runtime for Next.js      |
| Node.js | 24.11+ and below 25 (`.nvmrc`: `24`) | ESLint, Vitest and Playwright                    |
| Git     | any recent version                   | Husky installs a pre-commit hook (`lint-staged`) |
| OpenSSL | any                                  | generating secrets (`openssl rand`)              |

You also need these accounts:

- **GitHub**, for the repository `juliolmuller/juliolmuller.github.io`.
- **Sanity**, with access to project `njcnsmax` (organization `ow3ahfjbr`).
- **Vercel**, for the account or team that will own the project.
- Access to the DNS provider for `juliolmuller.com`.

**Windows:** use WSL2 and keep the clone inside the Linux filesystem (`~/…`, not `/mnt/c/…`). Turbopack and file watching are much slower across the boundary.

## 2. Local development

### 2.1 Install

```sh
git clone git@github.com:juliolmuller/juliolmuller.github.io.git juliolmuller.com
cd juliolmuller.com
bun install            # also installs the Husky pre-commit hook
cp .env.example .env.local
```

### 2.2 Choose a content source

**A. Fixtures (no accounts needed).** Leave every Sanity variable empty. The site runs on the in-memory demo data. The admin can sign in, but in a production build it is read-only.

**B. Sanity `development`.** Use this to work against real content storage or to try admin writes. Create a **local** Viewer token and Editor token ([SANITY.md → Tokens](./SANITY.md#tokens)), then set:

```dotenv
CONTENT_SOURCE=sanity
SANITY_PROJECT_ID=njcnsmax
SANITY_DATASET=development
SANITY_API_VERSION=2026-10-01
SANITY_READ_TOKEN=<local viewer token>
SANITY_WRITE_TOKEN=<local editor token>
```

If the `development` dataset is empty, seed it once with `bun run sanity:seed` (see [SANITY.md → Seeding](./SANITY.md#seeding)).

Never put `SANITY_DATASET=production` in `.env.local`.

### 2.3 Admin (optional)

```sh
openssl rand -base64 48                      # → SESSION_SECRET
bun run admin:hash "<a password of 16+ characters>"   # → ADMIN_PASSWORD_HASH
```

Put both values in `.env.local`. For a quick local try, a plain `ADMIN_PASSWORD` works too. Then press `Ctrl + /`, type `su julio`, enter the password, and type `admin`.

If either value is missing or too weak, the admin stays disabled and the server logs a warning naming the variable.

### 2.4 Run

```sh
bun run dev                          # http://localhost:3000 → /en
bun run build && bun run start       # production build on port 3000
```

### 2.5 Verify like CI does

```sh
bun run format:check && bun run lint && bun run typecheck
bun run test && bun run i18n:check && bun run icons:audit
bun run build && bun run check:bundle && bun run check:seo
bunx playwright install --with-deps chromium webkit firefox   # once
bun run test:e2e                     # needs the build; starts its own server on :3100
bun run lhci                         # optional, slow
```

- The e2e server always uses fixtures and test credentials (`playwright.config.ts`), whatever `.env.local` says.
- Visual snapshots are skipped locally. Run them with `VISUAL=1 bun run test:e2e visual.spec.ts`. The baselines are Linux PNGs.
- `bun run test:e2e` reuses a server that is already listening on :3100. Stop stale servers by their PID (`lsof -ti:3100`), not with `pkill -f "next start"`.
- **Lighthouse under WSL** leaves `C:\Users\…\lighthouse.*` folders in the repo root. They are git-ignored, but the next build crashes until you delete them: `rm -rf ./C:*`.

## 3. Sanity (one-time, shared by staging and production)

Full details are in [SANITY.md](./SANITY.md). In short:

1. **Datasets:** `development` and `production` must both exist and both be **private**. Do not add CORS origins; the browser never calls Sanity.
2. **Schema:** deploy `sanity/schema.ts` to both datasets ([SANITY.md → Schema](./SANITY.md#schema)).
3. **Seed `development`** with the fictional data: `bun run sanity:seed`. Then check it with `bun run content:smoke`.
4. **Tokens:** create a Viewer and Editor pair for each environment, and name them so you can tell them apart:

   | Token name                             | Role            | Goes into           |
   | -------------------------------------- | --------------- | ------------------- |
   | `local-read` / `local-write`           | Viewer / Editor | `.env.local`        |
   | `preview-read` / `preview-write`       | Viewer / Editor | Vercel → Preview    |
   | `production-read` / `production-write` | Viewer / Editor | Vercel → Production |

   A Viewer token can read every dataset in the project. Restricting a token to one dataset requires a custom role, which needs an Enterprise plan ([SANITY.md](./SANITY.md#tokens)).

5. **`production` content:** the `production` dataset starts empty. The pages tolerate missing content (sections hide and the default meta description is used), so an empty dataset should still render. You can enter content in two ways:
   - **Through the admin on the production deployment.** This is the intended path; you can do it before the domain points to Vercel (see §5.4).
   - Or seed the demo data with `bun run sanity:seed --dataset production --force`, then replace it item by item (checklist in [ADDING_CONTENT.md](./ADDING_CONTENT.md#what-the-owner-still-has-to-supply)). Use this only before any real content exists, because `--force` overwrites documents with the same ids.

## 4. Vercel project (one-time)

### 4.1 Create and link

1. In Vercel, choose **Add New → Project** and import `juliolmuller/juliolmuller.github.io`. Use the account or team you want to own it; a personal portfolio usually belongs on the personal (Hobby) account.
2. Build settings:

   | Setting          | Value                                               |
   | ---------------- | --------------------------------------------------- |
   | Framework preset | Next.js                                             |
   | Root directory   | `./`                                                |
   | Install command  | from `vercel.json`: `bun install --frozen-lockfile` |
   | Build command    | default (`bun run build`)                           |
   | Output directory | default                                             |
   | Node.js version  | 24.x                                                |
   | Bun runtime      | from `vercel.json`: `bunVersion: "1.4.x"`           |

3. **Settings → Git:** set the production branch to `main`. Every other branch, including `next`, then deploys as a Preview.
4. **Settings → Deployment Protection:** keep **Vercel Authentication** on with **Standard Protection**. Previews, including the staging domain, then require a Vercel login, and production stays public.
5. Don't import the first deployment with empty variables. Set up §4.2 first, or expect to redeploy once the variables are in.

### 4.2 Environment variables

In **Settings → Environment Variables**, add each variable to the right target. Mark every value except `NEXT_PUBLIC_SITE_URL` as **Sensitive**. Leave "Development" unchecked: local work reads `.env.local`, not Vercel.

| Variable                   | Production                                  | Preview                                     |
| -------------------------- | ------------------------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | `https://juliolmuller.com`                  | `https://staging.juliolmuller.com`          |
| `CONTENT_SOURCE`           | `sanity`                                    | `sanity`                                    |
| `SANITY_PROJECT_ID`        | `njcnsmax`                                  | `njcnsmax`                                  |
| `SANITY_DATASET`           | `production`                                | `development`                               |
| `SANITY_API_VERSION`       | `2026-10-01`                                | `2026-10-01`                                |
| `SANITY_READ_TOKEN`        | `production-read`                           | `preview-read`                              |
| `SANITY_WRITE_TOKEN`       | `production-write`                          | `preview-write`                             |
| `SANITY_WEBHOOK_SECRET`    | its own `openssl rand -hex 32`              | its own value (only if you add the webhook) |
| `SESSION_SECRET`           | its own `openssl rand -base64 48`           | its own value                               |
| `ADMIN_PASSWORD_HASH`      | `bun run admin:hash` with a strong password | a different password's hash                 |
| `GOOGLE_SITE_VERIFICATION` | from Search Console (after launch)          | leave empty                                 |
| `BING_SITE_VERIFICATION`   | from Bing Webmaster Tools (after launch)    | leave empty                                 |
| `ADMIN_FIXTURE_WRITES`     | **never set**                               | **never set**                               |
| `UPSTASH_REDIS_REST_*`     | leave empty (reserved, D51)                 | leave empty                                 |

Notes:

- `VERCEL_ENV` is set by Vercel. It is what keeps previews `noindex`; don't override it.
- **Preview site URL.** Without `NEXT_PUBLIC_SITE_URL`, previews fall back to `http://localhost:3000`. Canonical links and `og:image` then point to localhost, and HSTS and the `__Host-` cookie are off. Setting the Preview value to the staging domain fixes this for every branch.
  - On feature-branch previews, absolute URLs then point to staging. That is harmless, because previews are never indexed.
- **Password hash.** `ADMIN_PASSWORD_HASH` contains `$` characters. Paste it into the Vercel UI as-is. If you use `vercel env add`, read it from stdin so the shell doesn't expand it.
- **The build reads Sanity.** A wrong token or dataset fails the build loudly, by design; the previous deployment stays live.

### 4.3 Staging domain

1. **Settings → Domains → Add** `staging.juliolmuller.com`, and in its settings choose **Git branch: `next`**. Every push to `next` then updates staging.
2. At the DNS provider, add `CNAME staging → cname.vercel-dns.com` (Vercel shows the exact target).
3. Redeploy `next` so the build picks up the Preview variables.

## 5. Production cutover

**Read this first.** The repository is a GitHub Pages user site (`juliolmuller.github.io`), and `main` still holds the old static portfolio. Merging `next` into `main` replaces that site's source. Once that happens, GitHub Pages can no longer serve the old portfolio. Follow this order so nothing is down in between.

### 5.1 Before the merge

1. Make sure CI on `next` is green, including the `audit` job.
   - **Blocker today:** `bun audit` reports two critical advisories in Next 16.4.0 (GHSA-2464-fhr4-w9xw and GHSA-673q-mjm6-r5xr). Upgrade Next.js before going live.
2. Check staging: browse both locales, sign in to the admin, edit something in `development` and see it on the page.
3. Lower the DNS TTL for `juliolmuller.com` to 300 s a day ahead, so you can switch back quickly.

### 5.2 First production deployment

1. Merge `next` into `main` (pull request, CI green). Vercel builds production at `https://<project>.vercel.app`.
2. If the build fails, check the Sanity variables first. The pages tolerate missing content, so an empty `production` dataset should build, but that has not been tried against Sanity yet.

### 5.3 Domain

1. In Vercel, add the domain `juliolmuller.com`, plus `www.juliolmuller.com` redirecting to the apex with a 308. Vercel lists the DNS records it needs. Usually that is an `A @ 76.76.21.21` record and `CNAME www → cname.vercel-dns.com`.
2. **In GitHub → Settings → Pages:** remove the custom domain and turn Pages off. Otherwise GitHub keeps claiming the domain and keeps serving the old site at `juliolmuller.github.io`.
3. Update the DNS records. Vercel issues the TLS certificate automatically within minutes.
4. Since `NEXT_PUBLIC_SITE_URL` already says `https://juliolmuller.com`, no redeploy is needed for the domain itself.

### 5.4 Content and checks

1. Sign in to the admin on the production URL (`su julio` in the terminal) and enter the real content. If you seeded demo data, replace it.
   - You can do this on the `*.vercel.app` URL before the DNS switch. The session cookie works on any https host.
2. Configure the Sanity webhook for `production` ([SANITY.md → Revalidation webhook](./SANITY.md#revalidation-webhook)), with the production `SANITY_WEBHOOK_SECRET`. The admin refreshes pages by itself; the webhook only matters for edits made outside it.
3. Run the remote SEO crawl. An empty `SESSION_SECRET` skips the admin check, which needs the production secret:

   ```sh
   SESSION_SECRET= SEO_BASE_URL=https://juliolmuller.com bun run check:seo
   ```

4. Check the headers: `curl -sI https://juliolmuller.com/en` must show `strict-transport-security`, `content-security-policy` and no `x-robots-tag`. On a preview URL, the response must carry `noindex`.
5. Work through the launch checklists in [SEO.md](./SEO.md) (Search Console, Bing, sitemap submission) and the manual screen-reader pass in [ACCESSIBILITY.md](./ACCESSIBILITY.md).
6. Raise the DNS TTL back.

### 5.5 Rolling back

- **Code:** in Vercel → Deployments, choose an earlier production deployment and select **Instant Rollback**. Content is not affected.
- **Content:** Sanity keeps document history. Restore it from the document's history in Manage, or re-save the previous values in the admin.
- **Domain (first days only):** point DNS back to GitHub Pages and turn Pages on again from an older commit.

## 6. Staging webhook (optional)

Edits in the admin on staging already refresh staging. A `development` webhook only matters if someone edits `development` outside the admin. Because Deployment Protection blocks unauthenticated requests to previews:

1. In Vercel → Settings → Deployment Protection, create a **Protection Bypass for Automation** secret.
2. In Sanity, create a second webhook:
   - URL: `https://staging.juliolmuller.com/api/revalidate`
   - Dataset: `development`
   - HTTP header: `x-vercel-protection-bypass: <bypass secret>`
   - Webhook secret: the Preview `SANITY_WEBHOOK_SECRET`

## 7. Ongoing operations

| Task                        | How                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Ship a change               | Branch from `next`, open a PR to `next` (preview build plus CI), then merge `next` into `main` to release         |
| Dependency updates          | Dependabot opens grouped PRs on Mondays. Review release notes for the `framework` group (Next.js, React together) |
| Rotate the admin password   | `bun run admin:hash`, update `ADMIN_PASSWORD_HASH` in Vercel, redeploy                                            |
| Sign everyone out           | Change `SESSION_SECRET` and redeploy                                                                              |
| Rotate a Sanity token       | Create the new token, update Vercel, redeploy, then delete the old token in Sanity                                |
| Regenerate visual baselines | Actions → **Visual baselines** → Run workflow, then commit the PNGs it produces                                   |
| Debug production            | Vercel → Deployments → Runtime Logs. Content warnings log document paths, never values                            |

## Checklists

**Local**

- [ ] Bun 1.4 and Node 24 installed; repository cloned inside WSL's filesystem on Windows
- [ ] `bun install`, `.env.local` created from `.env.example`
- [ ] Content: fixtures (empty Sanity variables), or `development` with local tokens
- [ ] Optional admin: `SESSION_SECRET` and `ADMIN_PASSWORD_HASH`
- [ ] `bun run dev` serves `/en` and `/pt`

**Staging**

- [ ] Vercel project imported, production branch `main`, Node 24.x, Vercel Authentication on
- [ ] Preview variables set (dataset `development`, preview tokens, its own secrets)
- [ ] `staging.juliolmuller.com` assigned to branch `next`, DNS CNAME added
- [ ] Redeployed; admin works; pages carry `noindex`

**Production**

- [ ] Next.js upgraded past the critical advisories; CI green including `audit`
- [ ] Production variables set (dataset `production`, production tokens, its own secrets)
- [ ] `next` merged into `main`; production build succeeded
- [ ] GitHub Pages custom domain removed and Pages turned off
- [ ] DNS for the apex and `www` points to Vercel; certificate issued
- [ ] Real content entered; demo data gone
- [ ] Sanity webhook for `production`
- [ ] `check:seo` against the live URL, headers checked
- [ ] SEO and accessibility launch checklists done
