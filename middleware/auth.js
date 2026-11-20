'use strict';
const jwt = require('jsonwebtoken');
const db  = require('../db');

/**
 * requireAdmin
 * 1. Requires "Authorization: Bearer <token>".
 * 2. Verifies the token signature + expiry (HS256 only).
 * 3. Re-checks the user in the database on EVERY request, so a deleted or
 *    demoted account loses access immediately instead of when the token expires.
 * Fails closed: if JWT_SECRET is not configured, nothing is allowed through.
 */
function requireAdmin(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set - refusing admin request');
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required. Please log in as an administrator.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ message: 'Your session has expired or is invalid. Please log in again.' });
  }

  db.query('SELECT user_id, name, role FROM users WHERE user_id = ? LIMIT 1', [payload.uid], (err, rows) => {
    if (err) {
      console.error('Auth lookup error:', err);
      return res.status(500).json({ message: 'Could not verify your account.' });
    }
    if (!rows.length) {
      return res.status(401).json({ message: 'Account not found. Please log in again.' });
    }
    if (rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Administrator access is required for this action.' });
    }
    req.admin = { user_id: rows[0].user_id, name: rows[0].name };
    next();
  });
}

module.exports = { requireAdmin };