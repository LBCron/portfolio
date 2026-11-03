# Admin access

The admin lives at `/admin` and is reachable only through the terminal: open it with `Ctrl/Cmd + /`, type `su julio` and enter the password. Without a valid session every `/admin/**` request returns the same 404 as any unknown path.

## Setup

Set these server-only variables (see `.env.example`):

| Variable              | Notes                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| `SESSION_SECRET`      | 32+ characters, e.g. `openssl rand -base64 48`. Rotating it signs every session out.   |
| `ADMIN_PASSWORD_HASH` | Preferred. Print one with `bun run admin:hash "<password of 16+ characters>"`.         |
| `ADMIN_PASSWORD`      | Plaintext alternative (16+ characters in production). The hash wins when both are set. |

If the secret or the password is missing or too weak, the admin stays disabled: `su` always fails with the generic message and a warning naming the variable is logged once.

## Behavior

- Session: 30 minutes idle, 8 hours absolute, renewed at most once a minute while you browse the admin. A dialog offers "Stay signed in" two minutes before expiry.
- Failed logins: 5 per 15 minutes lock a client out for 15 minutes (doubling for repeat offenders); 30 per hour pause everyone. The limiter is in memory, so serverless instances do not share it. The client is identified by the first `x-forwarded-for` entry, so a self-hosted deployment must sit behind a proxy that overwrites that header.
- Every login answer takes at least 800 ms, whether it succeeds or not.

## Editing content

`/admin` has a dashboard and an editor for each area: profile, links, recommended, projects, experience, education, technologies, practices, contact and résumé. Saving publishes at once and refreshes the public pages.

- Lists have search, filters, a visible toggle (and featured for projects) and reordering with the arrows or by dragging the handle.
- Editors warn about unsaved changes, show problems in a summary that links to each field, and open a dialog when someone saved a newer version (Reload or Overwrite).
- Deleting asks you to type the item's name. Hiding is the reversible alternative. A technology that a project or job uses cannot be deleted.
- Images (JPEG, PNG, WebP, AVIF, up to 4 MB) are re-encoded and stripped of metadata; PDFs (up to 4 MB) are checked for scripts. Custom icons are pasted as SVG and reduced to plain filled shapes.
- With demo data in a production build the admin is read-only. Set `ADMIN_FIXTURE_WRITES=1` only for end-to-end tests.
