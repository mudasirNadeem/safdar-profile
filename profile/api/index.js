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

// ---- Admin only: list all contact submissions ---------------------------
app.get('/api/admin/messages', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, name, email, message, created_at
      FROM messages
      ORDER BY created_at DESC
    `;
    res.json({ messages: rows });
  } catch (err) {
    console.error('fetch messages failed:', err);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

export default app;
