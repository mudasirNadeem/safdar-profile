// Local dev server — runs the same Express API plus serves the static files,
// so you can test the whole site without Vercel. NOT used in production
// (Vercel serves statics itself and uses api/index.js directly).
//
//   node scripts/local-server.js   ->  http://localhost:3000
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import app from '../api/index.js';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// On Vercel the public/ folder is served automatically by the CDN.
// Locally we serve it ourselves so the site works the same way.
app.use(express.static(join(projectRoot, 'public')));

const port = process.env.PORT || 3100;
app.listen(port, () => {
  console.log(`\n  Site:  http://localhost:${port}/`);
  console.log(`  Admin: http://localhost:${port}/admin.html`);
  console.log(`  API:   http://localhost:${port}/api/health\n`);
});
