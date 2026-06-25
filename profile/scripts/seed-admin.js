// Seeds the single admin account.
// Run after db:init:  npm run db:seed-admin
//
// Credentials come from env vars so they are never committed to source.
// Defaults match what was requested: admin@gmail.com / admin123
// CHANGE THESE in production by setting ADMIN_EMAIL and ADMIN_PASSWORD.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to your .env file.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  const hash = await bcrypt.hash(adminPassword, 10);

  // Insert the admin, or update the hash/role if the email already exists.
  await sql`
    INSERT INTO users (email, password_hash, role)
    VALUES (${adminEmail}, ${hash}, 'admin')
    ON CONFLICT (email)
    DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
  `;

  console.log(`✅ Admin ready: ${adminEmail} (role=admin)`);
  console.log('   Log in with this email and the password you seeded.');
}

main().catch((err) => {
  console.error('Admin seed failed:', err);
  process.exit(1);
});
