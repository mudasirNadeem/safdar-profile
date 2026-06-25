// Authentication helpers: issue/verify JWTs and an Express middleware that
// allows ONLY admin users through.
import jwt from 'jsonwebtoken';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

// Create a signed token for a logged-in user. Expires in 8 hours.
export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '8h' });
}

// Express middleware: rejects anyone who is not a logged-in admin.
// Expects an "Authorization: Bearer <token>" header.
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, getSecret());
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
