# Safdar Hashim — Portfolio

Static portfolio site with an Express API (Vercel serverless functions) backed by
Neon Postgres.

## What's here

| Path                | Purpose                                                        |
| ------------------- | ------------------------------------------------------------- |
| `index.html`        | The public portfolio site. Contact form posts to `/api/contact`. |
| `admin.html`        | Admin login + panel listing all contact submissions.          |
| `resume.pdf`        | Resume, linked from the site (opens in a new tab).            |
| `api/index.js`      | Express app: `/api/contact`, `/api/login`, `/api/admin/messages`. |
| `api/db.js`         | Neon Postgres connection (reads `DATABASE_URL`).             |
| `api/auth.js`       | JWT signing + admin-only middleware.                         |
| `scripts/init-db.js`| Creates the `messages` and `users` tables.                  |
| `scripts/seed-admin.js` | Seeds the admin user (admin@gmail.com).                 |

## One-time setup

1. **Install deps**

   ```bash
   npm install
   ```

2. **Set environment variables** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — from the Neon console (**rotate it** if it was ever shared).
   - `JWT_SECRET` — a long random string:
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — admin login (defaults: admin@gmail.com / admin123).

3. **Create the tables and admin user**

   ```bash
   npm run db:init
   npm run db:seed-admin
   ```

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel.
2. In **Project Settings → Environment Variables**, add the same keys from your
   `.env`: `DATABASE_URL`, `JWT_SECRET` (and optionally `ADMIN_EMAIL` /
   `ADMIN_PASSWORD` if you re-run the seed).
3. Deploy. Static files are served from the root; `/api/*` is the Express function.

Your site: `https://<project>.vercel.app/`
Admin panel: `https://<project>.vercel.app/admin.html`

## Security notes

- Credentials live only in environment variables — never in client-side code or
  committed files. `.env` is gitignored.
- Only users with `role = 'admin'` can log in; the contact endpoint is the only
  public write.
- Passwords are stored as bcrypt hashes, never plaintext.
