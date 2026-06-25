// Creates the database schema in Neon Postgres.
// Run once after setting DATABASE_URL:  npm run db:init
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to your .env file.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // Contact-form submissions (replaces the old MySQL "messages" table).
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      message     TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Users table. Only rows with role = 'admin' are allowed to log in.
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  console.log('✅ Schema ready: tables "messages" and "users" created.');
}

main().catch((err) => {
  console.error('Schema creation failed:', err);
  process.exit(1);
});
