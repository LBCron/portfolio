# Adding content

Everything on the site except the owner's name, job title and city (`src/config/site.ts`) is edited in the admin. This guide is enough to add a project without reading the code. For setup and security, see [ADMIN.md](./ADMIN.md).

## 1. Sign in

1. Open the site and press `Ctrl + /` (`Cmd + /` on a Mac), or use the `>_` button in the header.
2. Type `su julio`, press Enter, then type the admin password and press Enter. Pasting works.
3. Type `admin` and press Enter. The dashboard opens.

The session lasts 30 minutes without activity (8 hours at most). Two minutes before it ends, a dialog offers **Stay signed in**. Type `logout` in the terminal, or use the button in the admin header, to sign out.

## 2. Add the technologies first

A project can only reference technologies that exist. In **Technologies**, check that every tool the project used is there. If one is missing:

1. **New technology** → name, category, priority (1 and 2 appear everywhere; 3 is left out of the cloud on phones but stays in the List view) and the official site (optional).
2. Icon: search the built-in sets (Simple Icons, Devicon) and pick one, paste a single-colour SVG (strokes and transforms are refused; convert them to filled shapes first), or leave it empty to get a two-letter monogram.
3. **Save and publish**.

## 3. Create the project

**Projects → New project.** Every text field has an English and a Portuguese box. On wide screens they sit side by side; on narrow screens they are tabs. **Copy EN → PT** fills the Portuguese side as a starting point; rewrite it in natural Brazilian Portuguese. A badge warns when a translation is missing or identical to the English.

| Field                     | What to write                                                                                                             | Limits                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Title                     | The product's name, not a sentence                                                                                        | 80 characters; aim for ≤ 60 (search results)                            |
| Tagline                   | One line on what it is                                                                                                    | 90                                                                      |
| Summary                   | Two sentences: the problem and the result. Also the meta description                                                      | 160; aim for 70–160                                                     |
| Slug                      | Lowercase words with hyphens (`pay-bridge`); it becomes the URL                                                           | Changing it later keeps the old URL working (308)                       |
| Year                      | The year it shipped or started                                                                                            | 1990–2100                                                               |
| Kind                      | web, mobile, desktop, automation, integration or open-source                                                              | Drives the filter on `/projects`                                        |
| Status                    | live, in-progress, archived or private                                                                                    | Shown as a badge                                                        |
| My role                   | e.g. "Tech lead and backend"                                                                                              | 80                                                                      |
| Featured                  | On Home (the first six) and first on `/projects`                                                                          | More than six shows a warning on the dashboard                          |
| Visible on the site       | Off keeps it out of every page, the sitemap, the terminal and search engines                                              | Use it for drafts                                                       |
| Context                   | The situation before you arrived                                                                                          | 1200                                                                    |
| Approach                  | What you did and why                                                                                                      | 1200                                                                    |
| Highlights                | 3 to 5 short, concrete outcomes ("Cut checkout errors by 40%")                                                            | 160 each                                                                |
| Outcome (optional)        | Where it ended up                                                                                                         | 400                                                                     |
| Full write-up (optional)  | Markdown. Headings, lists, links, code and gallery pictures (`![alt](gallery:1)`). Raw HTML and scripts are removed       | Under 150 words per language is flagged as a thin page on the dashboard |
| Live URL / Repository URL | `https://` links only                                                                                                     | Live adds the "Visit app" button                                        |
| Technologies              | Pick from the list (step 2)                                                                                               | Up to 24                                                                |
| Cover image               | JPEG, PNG, WebP or AVIF up to 8 MB. Alt text in both languages is required. Set the focal point so crops keep the subject | Without a cover a generated one is used                                 |
| Gallery                   | Up to 12 images, each with alt text and an optional caption                                                               | Opens in the lightbox                                                   |

Click **Save and publish**. If something is wrong, a summary at the top lists each problem and links to the field. On success the message "Published · public pages refreshed" appears, and the project is live at `/en/projects/<slug>` and `/pt/projects/<slug>`.

## 4. Check it

1. Open both URLs. With Sanity as the source the pages update at once; with demo data they can take a few seconds.
2. The dashboard's **Needs attention** list flags missing Portuguese, images without alt text, titles or summaries outside their ranges, thin write-ups and more than six featured projects.
3. In the terminal, `ls projects` and `open <slug>` should find it.

## 5. Order, hide and remove

- **Order:** in the list, use the arrow buttons or drag the handle. The order is used on Home and `/projects`.
- **Hide:** switch off **Visible**. This is reversible, and the URL then answers 404.
- **Delete:** open the project, choose **Delete…** and type its title to confirm. This cannot be undone.

## Other areas

| Area                   | Notes                                                                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile                | Display name, lead (up to 120 characters), title font, bio, facts, metrics, quote and photo (square, plus an optional 3:4 for large screens)                     |
| Links                  | Featured links and where each shows (header, footer, contact; the header shows three icons at most); "own profile" adds `rel="me"` and feeds the structured data |
| Recommended            | People worth following; a note of up to 140 characters                                                                                                           |
| Experience / Education | Timeline entries; "collapsed by default" folds older jobs                                                                                                        |
| Practices              | Text chips shown in the List view of the stack                                                                                                                   |
| Contact                | Email (shown obfuscated), the phone (only when "show phone" is on), the booking URL and the call-to-action text                                                  |
| Résumé                 | One PDF per language, up to 10 MB, checked for scripts. Without a file the download buttons hide and the terminal says it is not available yet                   |

**Title font.** Your display name is the hero title. In Profile, "Title font" picks one of ten script fonts, or "Geist (default)". To offer another one: add its id and label in `src/lib/content/taxonomy.ts`, a loader call in `src/styles/title-fonts.ts`, and redeploy the Sanity schema.

## What the owner still has to supply

The site launches with fictional demo data (marked `isFixture`). Replace all of it before or right after launch:

- [ ] Profile: real headline, lead, bio, facts, metrics, quote and portrait photo.
- [ ] Projects: real projects with covers, alt text in both languages, and technologies. Delete or hide the demo projects (`orbit-dashboard`, `pocket-ledger`, `tidy-desk`, `invoice-bot`, `pay-bridge`, `lint-kit`, `scratch-pad`).
- [ ] Experience and education: real employers, roles, dates and outcomes (no employer logos).
- [ ] Links: real GitHub and LinkedIn URLs (flag them "own profile"), and remove the demo links.
- [ ] Recommended: real people, or hide the section by hiding every entry.
- [ ] Contact: real email, booking URL and call to action; phone only if wanted.
- [ ] Résumé: real PDFs in English and Portuguese.
- [ ] Technologies: confirm the mobile and desktop frameworks (none are seeded on purpose).
- [ ] After launch: Search Console and Bing verification ([SEO.md](./SEO.md)) and the Sanity webhook ([SANITY.md](./SANITY.md)).
