import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
await sql`DELETE FROM messages WHERE email LIKE 'pg%@test.com'`;
const rows = await sql`SELECT id, name, email FROM messages ORDER BY id`;
console.log('Remaining real messages:', rows.length);
rows.forEach(r => console.log(`  #${r.id} ${r.name} <${r.email}>`));
