// Main Express API for the portfolio site, deployed as a single Vercel
// serverless function. The vercel.json rewrite sends every /api/* request here.
//
// Routes:
//   POST /api/contact          - public: save a contact-form submission
//   POST /api/login            - public: admin login, returns a JWT
//   GET  /api/admin/messages   - admin only: list all contact submissions
//   GET  /api/health           - public: simple health check
import express from 'express';
import bcrypt from 'bcryptjs';
import { sql } from './db.js';
import { signToken, requireAdmin } from './auth.js';

const app = express();
app.use(express.json());

// ---- Public: health check ------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// ---- Public: contact form submission ------------------------------------
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }

  try {
    await sql`
      INSERT INTO messages (name, email, message)
      VALUES (${name}, ${email}, ${message})
    `;
    res.status(200).json({ status: 'Success' });
  } catch (err) {
    console.error('contact insert failed:', err);
    res.status(500).json({ error: 'Could not save your message' });
  }
});

// ---- Public: admin login -------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const rows = await sql`
      SELECT id, email, password_hash, role
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    const user = rows[0];

    // Only admins may log in. Use a generic message so we don't reveal
    // whether the email exists or the role is wrong.
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error('login failed:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ---- Admin only: list contact submissions (paginated) -------------------
app.get('/api/admin/messages', requireAdmin, async (req, res) => {
  // Clamp page/limit to safe ranges so a bad query can't ask for everything.
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  try {
    const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM messages`;
    const rows = await sql`
      SELECT id, name, email, message, created_at
      FROM messages
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    res.json({
      messages: rows,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('fetch messages failed:', err);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

// ---- Admin only: delete one or more submissions by id --------------------
app.delete('/api/admin/messages', requireAdmin, async (req, res) => {
  const { ids } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Provide an array of ids to delete' });
  }

  // Keep only valid integers so nothing unexpected reaches the query.
  const cleanIds = ids
    .map((id) => parseInt(id, 10))
    .filter((id) => Number.isInteger(id));

  if (cleanIds.length === 0) {
    return res.status(400).json({ error: 'No valid ids provided' });
  }

  try {
    // The Neon driver maps a JS array to a Postgres array, so ANY(...) works
    // for deleting multiple ids in one statement.
    await sql`DELETE FROM messages WHERE id = ANY(${cleanIds})`;
    res.json({ deleted: cleanIds.length });
  } catch (err) {
    console.error('delete messages failed:', err);
    res.status(500).json({ error: 'Could not delete messages' });
  }
});

export default app;
