'use strict';

/* Salinan konsisten database email ke /data/backups/subscribers-YYYYMMDD.db
   (VACUUM INTO aman walau server sedang menulis) dan buang yang lebih dari 14 hari.
   Jalankan: docker compose exec -T winaya-mailer node backup.js */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'subscribers.db');
const dir = path.join(path.dirname(DB_PATH), 'backups');
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const target = path.join(dir, 'subscribers-' + stamp + '.db');
if (fs.existsSync(target)) fs.unlinkSync(target);

const db = new DatabaseSync(DB_PATH);
db.exec("VACUUM INTO '" + target.replace(/'/g, "''") + "'");
db.close();

const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
for (const f of fs.readdirSync(dir)) {
  const p = path.join(dir, f);
  if (/^subscribers-\d{8}\.db$/.test(f) && fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p);
}
console.log('Backup: ' + target);
