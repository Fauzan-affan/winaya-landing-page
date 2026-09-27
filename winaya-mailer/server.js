'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { validate, compute, rupiah, tierFor } = require('./calc');
const { buildPdf } = require('./pdf');
const { openDb } = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const PRODUCTION = process.env.NODE_ENV === 'production';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Farah dari Winaya <info@winaya.id>';
/* Tim yang diberi tahu setiap ada pengunjung yang dikirimi PDF. Bawaan: info@winaya.id.
   Isi OWNER_EMAIL untuk mengganti, atau OWNER_EMAIL= (kosong) untuk mematikan. */
const OWNER_EMAIL = process.env.OWNER_EMAIL === undefined ? 'info@winaya.id' : process.env.OWNER_EMAIL.trim();
/* Sisa slot Founding Customer, DIISI MANUAL (sama seperti "Slot tersisa" di HTML
   situs, tidak pernah dihitung otomatis). Isi 0 atau kosongkan saat slot habis:
   blok promo di email otomatis hilang. Program dicabut, bukan di-reset. */
const FOUNDING_SLOTS_LEFT = Math.max(0, parseInt(process.env.FOUNDING_SLOTS_LEFT === undefined ? '3' : process.env.FOUNDING_SLOTS_LEFT, 10) || 0);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://winaya.id').replace(/\/$/, '');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'subscribers.db');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://winaya.id,https://www.winaya.id')
  .split(',').map((s) => s.trim()).filter(Boolean);

/* Tanpa API key hanya boleh jalan di lokal (dry-run: PDF ditulis ke ./out,
   tidak ada email terkirim). Di production wajib ada key. */
if (PRODUCTION && !RESEND_API_KEY) {
  console.error('RESEND_API_KEY wajib diisi saat NODE_ENV=production.');
  process.exit(1);
}

const db = openDb(DB_PATH);

/* ---- Rate limit sederhana di memori (cukup untuk satu instance kecil) ---- */
const hits = new Map(); // key -> [timestamps]
function limited(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return true; }
  list.push(now);
  hits.set(key, list);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, list] of hits) {
    const fresh = list.filter((t) => now - t < 24 * 3600 * 1000);
    if (fresh.length) hits.set(k, fresh); else hits.delete(k);
  }
}, 10 * 60 * 1000).unref();

function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.socket.remoteAddress || 'unknown';
}

function send(res, status, obj, origin) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(obj));
}

function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('too_large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Angka ringkas untuk subjek: Rp153,8 juta / Rp1,2 miliar. */
function ringkas(n) {
  const v = Math.max(0, Math.round(n));
  const f = (x) => x.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return v >= 1e9 ? 'Rp' + f(v / 1e9) + ' miliar' : 'Rp' + f(v / 1e6) + ' juta';
}

/* ---- Email ---- */
function unsubUrl(token) { return PUBLIC_BASE_URL + '/api/berhenti?t=' + token; }

function emailHtml(v, r, token) {
  const tier = tierFor(v.headcount);
  const months = r.estimasi > 0 ? tier.price / (r.estimasi / 12) : 0;
  const payback = months > 0 && months < 12
    ? ' Dengan estimasi tersebut, biaya paket ini berpotensi tertutup dalam sekitar ' + Math.max(1, Math.round(months)) + ' bulan.'
    : '';
  const foundingWa = 'https://wa.me/6281311699123?text=' + encodeURIComponent(
    'Halo, saya tertarik dengan slot Founding Customer Winaya (Essential Rp19jt). Bisa jadwalkan konsultasi?');
  // Program Founding hanya untuk paket Essential: tampil hanya bila itu yang direkomendasikan.
  const founding = FOUNDING_SLOTS_LEFT > 0 && tier.name === 'Essential'
    ? '<div style="background:#EAF3E3;border:1px solid #B9D3AA;border-radius:14px;padding:20px;margin:0 0 24px">' +
      '<p style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#4C8A3C;font-weight:700;margin:0 0 6px">Program Founding Customer</p>' +
      '<p style="font-size:16px;font-weight:700;margin:0 0 8px">Paket Essential Rp19.000.000 untuk tiga perusahaan pertama</p>' +
      '<p style="font-size:14px;line-height:1.6;color:#5B6656;margin:0 0 6px">Harga normal Rp29.000.000, jadi selisihnya Rp10.000.000 (sekitar 34%). Isi paketnya sama: source code diserahkan penuh, lisensi perpetual, dan offline-first sebagai standar. Ini harga peluncuran, bukan diskon musiman yang kembali bulan depan.</p>' +
      '<p style="font-size:14px;line-height:1.6;color:#5B6656;margin:0 0 14px">Slot tersisa: <strong style="color:#23301E">' + FOUNDING_SLOTS_LEFT + ' dari 3</strong>. Program berakhir permanen begitu slot terisi, dan slot baru terhitung saat kesepakatan tertulis ditandatangani.</p>' +
      '<p style="margin:0"><a href="' + foundingWa + '" style="display:inline-block;border:2px solid #6FB25A;color:#3E7530;font-weight:700;font-size:14px;text-decoration:none;padding:10px 22px;border-radius:999px">Amankan slot Founding</a></p></div>'
    : '';
  const trialOffer = '<div style="background:#F3EEE0;border:1px solid #D9D6C8;border-radius:14px;padding:18px 20px;margin:0 0 24px">' +
    '<p style="font-size:14px;font-weight:700;margin:0 0 6px">Belum yakin untuk berkomitmen penuh?</p>' +
    '<p style="font-size:13px;line-height:1.6;color:#5B6656;margin:0">Kami juga membuka <strong>Uji Coba Satu Lokasi, 30 Hari</strong>: sistem yang sama, dipasang di satu lokasi atau tim Anda dengan hingga 100 karyawan. Biaya token hanya Rp500.000 untuk 30 hari, atau gratis bila Anda bersedia menjadi testimoni. Sampaikan minat ini saat konsultasi WhatsApp.</p></div>';
  const wa = 'https://wa.me/6281311699123?text=' + encodeURIComponent(
    'Halo, saya sudah menerima rincian perhitungan dari kalkulator Winaya (' + v.headcount + ' karyawan, estimasi ' +
    rupiah(r.low) + ' - ' + rupiah(r.high) + '/tahun) dan ingin berdiskusi lebih lanjut.');
  const marketingNote = v.marketing
    ? 'Karena Anda menyetujuinya, kami juga dapat mengirimkan informasi produk dan penawaran Winaya ke email ini.'
    : 'Email ini dikirim satu kali atas permintaan Anda.';
  return '<!doctype html><html lang="id"><body style="margin:0;background:#F3EEE0;font-family:Arial,Helvetica,sans-serif;color:#23301E">' +
    '<div style="max-width:560px;margin:0 auto;padding:32px 20px">' +
    '<p style="font-size:22px;font-weight:700;margin:0 0 24px">Winaya<span style="color:#4C8A3C">.</span></p>' +
    '<p style="font-size:15px;line-height:1.6;margin:0 0 16px">Terima kasih telah menggunakan kalkulator di winaya.id. Rincian perhitungan dan rekomendasi untuk tim Anda terlampir dalam bentuk PDF pada email ini.</p>' +
    '<div style="background:#fff;border:1px solid #D9D6C8;border-radius:14px;padding:20px;margin:0 0 20px">' +
    '<p style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#4C8A3C;font-weight:700;margin:0 0 6px">Estimasi potensi kerugian per tahun</p>' +
    '<p style="font-size:22px;font-weight:700;color:#4C8A3C;margin:0 0 10px">' + rupiah(r.low) + ' &ndash; ' + rupiah(r.high) + '</p>' +
    '<p style="font-size:13px;line-height:1.6;color:#5B6656;margin:0">Untuk ' + v.headcount + ' karyawan lapangan dengan metode absensi &ldquo;' + r.methodText + '&rdquo;. Angka ini adalah estimasi berdasarkan asumsi yang dapat disesuaikan, bukan angka pasti.</p></div>' +
    '<p style="font-size:15px;line-height:1.6;margin:0 0 20px">Sebagai titik awal, untuk sekitar ' + v.headcount + ' karyawan kami menyarankan paket <strong>' + tier.name + '</strong> (' + rupiah(tier.price) + ', sekali bayar, tanpa biaya langganan).' + payback + ' Rinciannya ada di PDF terlampir.</p>' +
    founding +
    trialOffer +
    '<p style="margin:0 0 12px"><a href="' + wa + '" style="display:inline-block;background:#6FB25A;color:#08120A;font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:999px">Jadwalkan konsultasi via WhatsApp</a></p>' +
    '<p style="margin:0 0 28px;font-size:14px"><a href="' + PUBLIC_BASE_URL + '/#harga" style="color:#4C8A3C;font-weight:700">Lihat semua paket dan harga</a></p>' +
    '<p style="font-size:15px;line-height:1.6;margin:0 0 28px">Salam,<br>Farah</p>' +
    '<p style="font-size:12px;line-height:1.6;color:#5B6656;margin:0">Anda menerima email ini karena mengisi kalkulator di winaya.id. ' + marketingNote +
    ' Anda dapat <a href="' + unsubUrl(token) + '" style="color:#4C8A3C">berhenti berlangganan</a> kapan saja. Cara kami mengelola data Anda dijelaskan di <a href="' + PUBLIC_BASE_URL + '/kebijakan-privasi.html" style="color:#4C8A3C">Kebijakan Privasi</a>.</p>' +
    '</div></body></html>';
}

/* Notifikasi lead untuk tim Winaya (email terpisah dari email ke pengunjung). */
function leadHtml(v, r, isNew) {
  const tier = tierFor(v.headcount);
  const rows = [
    ['Email', v.email],
    ['Pengunjung', isNew ? 'Baru' : 'Pernah mengisi sebelumnya (minat tinggi, segera disapa)'],
    ['Setuju info marketing', v.marketing ? 'Ya' : 'Tidak'],
    ['Paket yang disarankan', tier.name + ' (' + rupiah(tier.price) + ')'],
    ['Promo Founding di email', FOUNDING_SLOTS_LEFT > 0 && tier.name === 'Essential' ? 'Ya' : 'Tidak'],
    ['Jumlah karyawan', v.headcount + ' orang'], ['Metode absensi', r.methodText], ['Rentang gaji', r.salaryText],
    ['Estimasi kerugian / tahun', rupiah(r.low) + ' – ' + rupiah(r.high)]
  ];
  return '<!doctype html><html lang="id"><body style="font-family:Arial,Helvetica,sans-serif;color:#23301E"><p style="font-size:16px;font-weight:700">Lead baru dari kalkulator winaya.id</p>' +
    '<table cellpadding="6" style="border-collapse:collapse;font-size:14px">' +
    rows.map(([k, val]) => '<tr><td style="color:#5B6656;border-bottom:1px solid #eee">' + esc(k) + '</td><td style="font-weight:700;border-bottom:1px solid #eee">' + esc(val) + '</td></tr>').join('') +
    '</table><p style="font-size:12px;color:#5B6656">PDF yang dikirim ke pengunjung terlampir. Balas email ini untuk menghubungi pengunjung.</p></body></html>';
}

async function postResend(payload) {
  const resp = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error('resend_' + resp.status + ' ' + text.slice(0, 200));
  }
}

async function sendEmails(v, r, pdf, token, isNew) {
  const filename = 'Winaya-Rincian-Perhitungan.pdf';
  if (!RESEND_API_KEY) {
    const dir = path.join(__dirname, 'out');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), pdf);
    console.log('[dry-run] PDF ditulis ke out/' + filename + ' (tidak ada email terkirim)');
    return { dryRun: true };
  }
  const attachments = [{ filename, content: pdf.toString('base64') }];

  // 1) Email ke pengunjung: wajib berhasil. Header List-Unsubscribe mendukung tombol "berhenti" di klien email.
  await postResend({
    from: MAIL_FROM,
    to: [v.email],
    subject: 'Potensi kerugian absensi Anda: sekitar ' + ringkas(r.low) + ' per tahun',
    html: emailHtml(v, r, token),
    headers: {
      'List-Unsubscribe': '<' + unsubUrl(token) + '>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    },
    attachments
  });

  // 2) Notifikasi lead ke tim: best-effort, kegagalannya tidak menggagalkan permintaan pengunjung.
  if (OWNER_EMAIL) {
    try {
      await postResend({
        from: MAIL_FROM,
        to: [OWNER_EMAIL],
        reply_to: v.email,
        subject: (isNew ? 'Lead baru' : 'Lead berulang') + ': ' + v.email + ' (' + v.headcount + ' karyawan, ' + tierFor(v.headcount).name + ')',
        html: leadHtml(v, r, isNew),
        attachments
      });
    } catch (err) {
      console.error('Notifikasi lead gagal:', err.message);
    }
  }
  return { dryRun: false };
}

/* ---- Halaman berhenti berlangganan ---- */
function page(title, body) {
  return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
    '<title>' + esc(title) + ' | Winaya</title></head><body style="margin:0;background:#F3EEE0;font-family:Arial,Helvetica,sans-serif;color:#23301E">' +
    '<div style="max-width:460px;margin:12vh auto;padding:0 20px"><p style="font-size:22px;font-weight:700;margin:0 0 20px">Winaya<span style="color:#4C8A3C">.</span></p>' + body + '</div></body></html>';
}

async function handleUnsubscribe(req, res, url) {
  const ip = clientIp(req);
  if (limited('unsub:' + ip, 30, 3600 * 1000)) return sendHtml(res, 429, page('Terlalu banyak permintaan', '<p>Terlalu banyak permintaan. Silakan coba lagi nanti.</p>'));
  let token = url.searchParams.get('t') || '';
  if (req.method === 'POST') {
    // Form dari halaman ini mengirim t di body; one-click dari klien email memakai t di query.
    const raw = await readBody(req, 1024).catch(() => '');
    token = new URLSearchParams(raw).get('t') || token;
  }
  if (!db.isValidToken(token)) return sendHtml(res, 400, page('Tautan tidak valid', '<p>Tautan berhenti berlangganan tidak valid atau sudah kedaluwarsa.</p>'));

  if (req.method === 'POST') {
    db.unsubscribe(token);
    return sendHtml(res, 200, page('Berhenti berlangganan', '<p style="font-size:18px;font-weight:700">Anda sudah berhenti berlangganan.</p><p style="line-height:1.6;color:#5B6656">Kami tidak akan mengirim informasi produk atau penawaran lagi ke email ini. Bila Anda ingin data Anda dihapus seluruhnya, hubungi kami melalui WhatsApp di +62 813-1169-9123.</p>'));
  }
  // GET hanya menampilkan konfirmasi (pemindai tautan email tidak boleh berhenti-berlangganan otomatis).
  return sendHtml(res, 200, page('Berhenti berlangganan',
    '<p style="font-size:18px;font-weight:700">Berhenti menerima email dari Winaya?</p>' +
    '<form method="POST" action="/api/berhenti"><input type="hidden" name="t" value="' + esc(token) + '">' +
    '<button type="submit" style="background:#6FB25A;color:#08120A;font-weight:700;font-size:15px;border:0;border-radius:999px;padding:13px 26px;cursor:pointer">Ya, berhenti berlangganan</button></form>'));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const origin = req.headers.origin || '';
  const originOk = !origin || ALLOWED_ORIGINS.includes(origin) || (!PRODUCTION && /^http:\/\/localhost:\d+$/.test(origin));
  const corsOrigin = origin && originOk ? origin : '';

  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true });

  if (url.pathname === '/api/berhenti' && (req.method === 'GET' || req.method === 'POST')) {
    return handleUnsubscribe(req, res, url);
  }

  if (url.pathname !== '/api/kirim-rincian') return send(res, 404, { ok: false, error: 'Tidak ditemukan.' });

  if (req.method === 'OPTIONS') {
    res.writeHead(originOk ? 204 : 403, {
      'Access-Control-Allow-Origin': corsOrigin || 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin'
    });
    return res.end();
  }
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Metode tidak diizinkan.' });
  if (!originOk) return send(res, 403, { ok: false, error: 'Asal permintaan tidak diizinkan.' });

  const ip = clientIp(req);
  if (limited('ip:' + ip, Number(process.env.RATE_LIMIT_IP) || 5, 3600 * 1000)) {
    return send(res, 429, { ok: false, error: 'Terlalu banyak permintaan. Silakan coba lagi dalam satu jam.' }, corsOrigin);
  }

  let body;
  try { body = JSON.parse(await readBody(req, 4096)); } catch (e) {
    return send(res, 400, { ok: false, error: 'Permintaan tidak valid.' }, corsOrigin);
  }

  // Honeypot: kolom tersembunyi yang tidak pernah diisi manusia. Pura-pura sukses agar bot tidak belajar.
  if (body && typeof body.website === 'string' && body.website.trim() !== '') {
    return send(res, 200, { ok: true }, corsOrigin);
  }

  const check = validate(body);
  if (!check.ok) return send(res, 400, { ok: false, error: check.error }, corsOrigin);
  const v = check.value;

  if (limited('email:' + v.email, 3, 24 * 3600 * 1000)) {
    return send(res, 429, { ok: false, error: 'Rincian untuk email ini sudah dikirim beberapa kali hari ini.' }, corsOrigin);
  }

  try {
    const r = compute(v);
    const { token, isNew } = db.upsert(v, r);
    const pdf = await buildPdf(v, r);
    const result = await sendEmails(v, r, pdf, token, isNew);
    return send(res, 200, { ok: true, dryRun: result.dryRun }, corsOrigin);
  } catch (err) {
    console.error('Gagal memproses:', err.message);
    return send(res, 502, { ok: false, error: 'Email belum berhasil dikirim. Silakan coba lagi sebentar lagi.' }, corsOrigin);
  }
});

server.listen(PORT, () => console.log('winaya-mailer mendengarkan di port ' + PORT + (RESEND_API_KEY ? '' : ' (dry-run)') + ', database: ' + DB_PATH));
process.on('SIGTERM', () => { server.close(() => { db.close(); process.exit(0); }); });
