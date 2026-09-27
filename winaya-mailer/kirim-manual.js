'use strict';

/* Kirim satu laporan Rincian Perhitungan secara MANUAL oleh tim (bukan lewat
   kalkulator): hitung di server, buat PDF, lalu kirim ke satu penerima dengan
   sapaan personal. Tidak menyimpan apa pun ke database marketing, tidak
   membuka endpoint publik, dan footer email tidak mengaku "mengisi kalkulator".

   Contoh:
     RESEND_API_KEY=... node kirim-manual.js --email nama@contoh.com \
       --name "Ibu Novianti Pratiwi" --company "PT GPI" \
       --headcount 40 --method whatsapp --salary 3000000 --leak 1.2 --hours 4.4 --rate 40000
   Tambahkan --dry untuk hanya membuat pratinjau di ./out tanpa mengirim. */

const fs = require('fs');
const path = require('path');
const { validate, compute, tierFor, rupiah } = require('./calc');
const { buildPdf } = require('./pdf');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const dry = process.argv.includes('--dry');

const input = {
  email: arg('email'),
  consent: true, // penerima dihubungi oleh tim secara langsung; tidak ada opt-in marketing
  marketing: false,
  headcount: Number(arg('headcount')),
  method: arg('method'),
  salary: Number(arg('salary')),
  leakPct: Number(arg('leak')),
  hoursPerMonth: Number(arg('hours')),
  ratePerHour: Number(arg('rate'))
};
const name = String(arg('name', '')).trim();
const company = String(arg('company', '')).trim();

const check = validate(input);
if (!check.ok) { console.error('Data tidak valid: ' + check.error); process.exit(1); }
const v = { ...check.value, name, company };
const r = compute(v);
const tier = tierFor(v.headcount);

const FOUNDING_SLOTS_LEFT = Math.max(0, parseInt(process.env.FOUNDING_SLOTS_LEFT === undefined ? '3' : process.env.FOUNDING_SLOTS_LEFT, 10) || 0);
const MAIL_FROM = process.env.MAIL_FROM || 'Farah dari Winaya <info@winaya.id>';
const BCC = process.env.OWNER_EMAIL === undefined ? 'info@winaya.id' : process.env.OWNER_EMAIL.trim();

function ringkas(n) {
  const x = Math.max(0, Math.round(n));
  const f = (y) => y.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return x >= 1e9 ? 'Rp' + f(x / 1e9) + ' miliar' : 'Rp' + f(x / 1e6) + ' juta';
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

const months = r.estimasi > 0 ? tier.price / (r.estimasi / 12) : 0;
const payback = months > 0 && months < 12
  ? ' Dengan estimasi tersebut, biaya paket ini berpotensi tertutup dalam sekitar ' + Math.max(1, Math.round(months)) + ' bulan.' : '';
const wa = 'https://wa.me/6281311699123?text=' + encodeURIComponent(
  'Halo, saya sudah menerima rincian perhitungan absensi' + (company ? ' untuk ' + company : '') + ' dan ingin berdiskusi lebih lanjut.');
const foundingWa = 'https://wa.me/6281311699123?text=' + encodeURIComponent('Halo, saya tertarik dengan slot Founding Customer Winaya (Essential Rp19jt). Bisa jadwalkan konsultasi?');
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

const html = '<!doctype html><html lang="id"><body style="margin:0;background:#F3EEE0;font-family:Arial,Helvetica,sans-serif;color:#23301E">' +
  '<div style="max-width:560px;margin:0 auto;padding:32px 20px">' +
  '<p style="font-size:22px;font-weight:700;margin:0 0 24px">Winaya<span style="color:#4C8A3C">.</span></p>' +
  '<p style="font-size:15px;line-height:1.6;margin:0 0 16px">Yth. ' + esc(name || 'Bapak/Ibu') + (company ? ' (' + esc(company) + ')' : '') + ',</p>' +
  '<p style="font-size:15px;line-height:1.6;margin:0 0 16px">Terlampir rincian perhitungan potensi kerugian absensi' + (company ? ' untuk ' + esc(company) : '') + ' dalam bentuk PDF, lengkap dengan asumsi yang dipakai dan rekomendasi paket.</p>' +
  '<div style="background:#fff;border:1px solid #D9D6C8;border-radius:14px;padding:20px;margin:0 0 20px">' +
  '<p style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#4C8A3C;font-weight:700;margin:0 0 6px">Estimasi potensi kerugian per tahun</p>' +
  '<p style="font-size:22px;font-weight:700;color:#4C8A3C;margin:0 0 10px">' + rupiah(r.low) + ' &ndash; ' + rupiah(r.high) + '</p>' +
  '<p style="font-size:13px;line-height:1.6;color:#5B6656;margin:0">Untuk ' + v.headcount + ' karyawan lapangan dengan metode absensi &ldquo;' + r.methodText + '&rdquo;. Angka ini adalah estimasi berdasarkan asumsi yang dapat disesuaikan, bukan angka pasti.</p></div>' +
  '<p style="font-size:15px;line-height:1.6;margin:0 0 20px">Sebagai titik awal, untuk sekitar ' + v.headcount + ' karyawan kami menyarankan paket <strong>' + tier.name + '</strong> (' + rupiah(tier.price) + ', sekali bayar, tanpa biaya langganan).' + payback + ' Rinciannya ada di PDF terlampir.</p>' +
  founding +
  trialOffer +
  '<p style="margin:0 0 12px"><a href="' + wa + '" style="display:inline-block;background:#6FB25A;color:#08120A;font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:999px">Jadwalkan konsultasi via WhatsApp</a></p>' +
  '<p style="margin:0 0 28px;font-size:14px"><a href="https://winaya.id/#harga" style="color:#4C8A3C;font-weight:700">Lihat semua paket dan harga</a></p>' +
  '<p style="font-size:15px;line-height:1.6;margin:0 0 28px">Salam,<br>Farah</p>' +
  '<p style="font-size:12px;line-height:1.6;color:#5B6656;margin:0">Email ini dikirim satu kali oleh tim Winaya dan tidak akan diikuti email otomatis. Bila Anda tidak berkenan menerimanya, cukup balas email ini dan kami tidak akan mengirim lagi. Cara kami mengelola data dijelaskan di <a href="https://winaya.id/kebijakan-privasi.html" style="color:#4C8A3C">Kebijakan Privasi</a>.</p>' +
  '</div></body></html>';

const subject = 'Rincian potensi kerugian absensi' + (company ? ' ' + company : '') + ': sekitar ' + ringkas(r.low) + ' per tahun';

(async () => {
  const pdf = await buildPdf(v, r);
  if (dry) {
    const dir = path.join(__dirname, 'out');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'manual.pdf'), pdf);
    fs.writeFileSync(path.join(dir, 'manual.html'), html);
    console.log('[dry] Subjek : ' + subject);
    console.log('[dry] Ke     : ' + v.email + (BCC ? ' (salinan: ' + BCC + ')' : ''));
    console.log('[dry] Hasil  : ' + rupiah(r.low) + ' - ' + rupiah(r.high) + ' | paket ' + tier.name + ' | Founding: ' + (founding ? 'ya' : 'tidak'));
    console.log('[dry] Berkas : out/manual.pdf, out/manual.html');
    return;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY belum diisi.'); process.exit(1); }
  const payload = {
    from: MAIL_FROM, to: [v.email], subject, html,
    attachments: [{ filename: 'Winaya-Rincian-Perhitungan' + (company ? '-' + company.replace(/[^A-Za-z0-9]+/g, '-') : '') + '.pdf', content: pdf.toString('base64') }]
  };
  if (BCC) payload.bcc = [BCC];
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const body = await resp.text();
  if (!resp.ok) { console.error('Gagal (' + resp.status + '): ' + body.slice(0, 300)); process.exit(1); }
  console.log('Terkirim ke ' + v.email + (BCC ? ' (salinan ke ' + BCC + ')' : '') + '. Subjek: ' + subject);
})().catch((e) => { console.error('Kesalahan: ' + e.message); process.exit(1); });
