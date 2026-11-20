'use strict';
const mysql = require('mysql2/promise');

/**
 * Opens a short-lived, dedicated connection for ONE transaction.
 * db.js exports a single shared connection, so running BEGIN/COMMIT on it
 * would pull other users' concurrent queries into this transaction.
 * Always call conn.end() in a finally block.
 */
function openTxConnection() {
  return mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:      { rejectUnauthorized: true },
  });
}

module.exports = { openTxConnection };