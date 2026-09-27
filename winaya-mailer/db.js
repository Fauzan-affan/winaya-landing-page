'use strict';

/* Penyimpanan email pengunjung (SQLite, satu file) untuk kebutuhan marketing.
   Memakai node:sqlite bawaan Node 22.5+ (tanpa dependensi native tambahan).
   File database harus berada di volume Docker agar tidak hilang saat container
   dibuat ulang, dan ikut dibackup. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

/* Versi teks persetujuan yang tampil saat email diambil. Kotak marketing TIDAK tercentang bawaan (opt-in aktif). */
const CONSENT_VERSION = '2026-09-25';

function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      token TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL DEFAULT 'kalkulator',
      created_at TEXT NOT NULL,
      last_request_at TEXT NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 1,
      marketing_optin INTEGER NOT NULL DEFAULT 0,
      marketing_consent_at TEXT,
      consent_version TEXT,
      unsubscribed_at TEXT,
      last_headcount INTEGER,
      last_method TEXT,
      last_salary INTEGER,
      last_estimate_low INTEGER,
      last_estimate_high INTEGER
    )
  `);

  const q = {
    byEmail: db.prepare('SELECT * FROM subscribers WHERE email = ?'),
    byToken: db.prepare('SELECT * FROM subscribers WHERE token = ?'),
    insert: db.prepare(`INSERT INTO subscribers
      (email, token, created_at, last_request_at, marketing_optin, marketing_consent_at, consent_version,
       last_headcount, last_method, last_salary, last_estimate_low, last_estimate_high)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    touch: db.prepare(`UPDATE subscribers SET last_request_at = ?, request_count = request_count + 1,
      last_headcount = ?, last_method = ?, last_salary = ?, last_estimate_low = ?, last_estimate_high = ? WHERE id = ?`),
    optIn: db.prepare(`UPDATE subscribers SET marketing_optin = 1, marketing_consent_at = ?, consent_version = ?,
      unsubscribed_at = NULL WHERE id = ?`),
    unsub: db.prepare('UPDATE subscribers SET marketing_optin = 0, unsubscribed_at = ? WHERE token = ?'),
    del: db.prepare('DELETE FROM subscribers WHERE email = ?'),
    marketing: db.prepare(`SELECT email, created_at, marketing_consent_at, last_headcount, last_method, last_salary,
      last_estimate_low, last_estimate_high, request_count FROM subscribers
      WHERE marketing_optin = 1 AND unsubscribed_at IS NULL ORDER BY created_at`),
    all: db.prepare(`SELECT email, created_at, marketing_optin, unsubscribed_at, request_count FROM subscribers ORDER BY created_at`),
    counts: db.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN marketing_optin = 1 AND unsubscribed_at IS NULL THEN 1 ELSE 0 END) AS marketing,
      SUM(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 ELSE 0 END) AS unsubscribed FROM subscribers`)
  };

  return {
    /* Simpan/perbarui satu pengunjung. Opt-in marketing hanya naik lewat
       persetujuan eksplisit; mengirim ulang tanpa centang tidak mencabutnya
       (pencabutan hanya lewat tautan berhenti berlangganan). */
    upsert(v, r) {
      const now = new Date().toISOString();
      const est = [v.headcount, v.method, v.salary, Math.round(r.low), Math.round(r.high)];
      let row = q.byEmail.get(v.email);
      if (!row) {
        const token = crypto.randomBytes(24).toString('hex');
        q.insert.run(v.email, token, now, now, v.marketing ? 1 : 0, v.marketing ? now : null, v.marketing ? CONSENT_VERSION : null, ...est);
        return { token, isNew: true };
      }
      q.touch.run(now, ...est, row.id);
      if (v.marketing) q.optIn.run(now, CONSENT_VERSION, row.id);
      return { token: row.token, isNew: false };
    },
    isValidToken: (t) => typeof t === 'string' && /^[0-9a-f]{48}$/.test(t),
    unsubscribe(token) { return q.unsub.run(new Date().toISOString(), token).changes > 0; },
    deleteByEmail(email) { return q.del.run(String(email).toLowerCase()).changes > 0; },
    marketingList: () => q.marketing.all(),
    allList: () => q.all.all(),
    counts: () => q.counts.get(),
    close: () => db.close()
  };
}

module.exports = { openDb, CONSENT_VERSION };
