// Neon Postgres connection helper.
// The connection string is read ONLY from the DATABASE_URL environment variable.
// Never hardcode credentials here — set DATABASE_URL in Vercel project settings
// (and in a local, gitignored .env for development).
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// `sql` is a tagged-template function. Interpolated values are passed as
// parameters (not string-concatenated), so it is safe against SQL injection.
export const sql = neon(process.env.DATABASE_URL);
