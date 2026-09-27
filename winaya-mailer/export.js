'use strict';

/* Alat baris perintah untuk mengakses daftar email kapan saja.

   node export.js                 CSV email yang boleh dikirimi marketing (opt-in, belum berhenti)
   node export.js --all           CSV semua email yang tersimpan (termasuk yang belum opt-in / sudah berhenti)
   node export.js --stats         ringkasan jumlah
   node export.js --delete EMAIL  hapus satu email (permintaan penghapusan data)

   Di Docker: docker compose exec winaya-mailer node export.js > email-marketing.csv */

const { openDb } = require('./db');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'subscribers.db');
const db = openDb(DB_PATH);
const arg = process.argv[2];

function cell(v) {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // cegah formula injection saat dibuka di Excel/Sheets
  return '"' + s.replace(/"/g, '""') + '"';
}
function csv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.join(',')].concat(rows.map((r) => cols.map((c) => cell(r[c])).join(','))).join('\n') + '\n';
}

if (arg === '--stats') {
  const c = db.counts();
  console.log('Total email tersimpan : ' + c.total);
  console.log('Boleh dikirimi marketing: ' + (c.marketing || 0));
  console.log('Sudah berhenti          : ' + (c.unsubscribed || 0));
} else if (arg === '--delete') {
  const email = process.argv[3];
  if (!email) { console.error('Sebutkan email yang dihapus.'); process.exit(1); }
  console.log(db.deleteByEmail(email) ? 'Dihapus: ' + email : 'Tidak ditemukan: ' + email);
} else if (arg === '--all') {
  process.stdout.write(csv(db.allList()));
} else {
  process.stdout.write(csv(db.marketingList()));
}
db.close();
