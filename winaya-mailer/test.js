'use strict';
/* Uji integrasi: Resend tiruan + database sementara. */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const assert = require('assert');

const dbFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'winaya-')), 'subscribers.db');
const env = {
  ...process.env, PORT: '3301', NODE_ENV: 'production', RESEND_API_KEY: 're_test', RESEND_API_URL: 'http://localhost:3300',
  OWNER_EMAIL: 'owner@winaya.id', MAIL_FROM: 'Winaya <hello@winaya.id>', DB_PATH: dbFile, RATE_LIMIT_IP: '50', PUBLIC_BASE_URL: 'https://winaya.id'
};

const calls = [];
const mock = http.createServer((req, res) => {
  let b = ''; req.on('data', (c) => (b += c));
  req.on('end', () => {
    calls.push({ auth: req.headers.authorization, body: JSON.parse(b) });
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"id":"x"}');
  });
});

const good = { email: 'Budi@Perusahaan.co.id', headcount: 120, method: 'whatsapp', salary: 6500000, leakPct: 3, hoursPerMonth: 10, ratePerHour: 75000, consent: true, marketing: true };
const cli = (...a) => spawnSync('node', ['export.js', ...a], { env, encoding: 'utf8' });

mock.listen(3300, () => {
  const srv = spawn('node', ['server.js'], { env, stdio: ['ignore', 'ignore', 'inherit'] });
  const post = (body) => fetch('http://localhost:3301/api/kirim-rincian', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://winaya.id' }, body: JSON.stringify(body)
  });

  setTimeout(async () => {
    try {
      // Validasi
      assert.strictEqual((await post({ ...good, email: 'bukan-email' })).status, 400);
      assert.strictEqual((await post({ ...good, consent: false, email: 'a@x.co' })).status, 400);
      assert.strictEqual(calls.length, 0);
      assert.strictEqual(cli('--stats').stdout.includes('Total email tersimpan : 0'), true, 'data tidak valid tidak boleh tersimpan');

      // Jam admin: rentang 1 sampai 40 per bulan
      assert.strictEqual((await post({ ...good, email: 'jam0@x.co', hoursPerMonth: 0 })).status, 400);
      assert.strictEqual((await post({ ...good, email: 'jam41@x.co', hoursPerMonth: 41 })).status, 400);
      assert.strictEqual(calls.length, 0);

      // Kirim + simpan (marketing opt-in)
      assert.strictEqual((await post(good)).status, 200);
      assert.strictEqual(calls.length, 2, 'email pengunjung + notifikasi lead');
      const [visitor, lead] = calls.map((c) => c.body);
      assert.deepStrictEqual(visitor.to, ['budi@perusahaan.co.id'], 'email dinormalisasi ke huruf kecil');
      assert.strictEqual(visitor.subject, 'Potensi kerugian absensi Anda: sekitar Rp231,8 juta per tahun');
      assert.ok(visitor.html.includes('Salam,<br>Farah'));
      assert.ok(!visitor.html.includes('Founding'), 'rekomendasi Complete: promo Founding tidak boleh tampil');
      assert.ok(visitor.html.includes('Rp231.840.000') && visitor.html.includes('Rp347.760.000'));
      assert.strictEqual(Buffer.from(visitor.attachments[0].content, 'base64').slice(0, 4).toString(), '%PDF');
      const unsub = /https:\/\/winaya\.id\/api\/berhenti\?t=([0-9a-f]{48})/.exec(visitor.html);
      assert.ok(unsub, 'tautan berhenti berlangganan harus ada di email');
      assert.ok(visitor.headers['List-Unsubscribe'].includes(unsub[1]) && visitor.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click');
      assert.deepStrictEqual(lead.to, ['owner@winaya.id']);
      assert.strictEqual(lead.reply_to, 'budi@perusahaan.co.id');
      assert.ok(lead.subject.startsWith('Lead baru: budi@perusahaan.co.id (120 karyawan, Complete)'), 'subjek notifikasi lead baru');
      assert.ok(lead.html.includes('Complete (Rp45.000.000)') && lead.html.includes('Baru'), 'notifikasi memuat paket disarankan dan status baru');

      // Database
      let csv = cli().stdout;
      assert.ok(csv.includes('budi@perusahaan.co.id'), 'email opt-in harus muncul di ekspor marketing');
      assert.ok(cli('--stats').stdout.includes('Boleh dikirimi marketing: 1'));

      // Kirim ulang TANPA centang marketing: tetap satu baris, opt-in tidak dicabut
      await post({ ...good, marketing: false });
      assert.ok(cli('--stats').stdout.includes('Total email tersimpan : 1'), 'email yang sama tidak boleh dobel');
      assert.ok(cli('--stats').stdout.includes('Boleh dikirimi marketing: 1'));

      // Pengunjung lain tanpa opt-in: tersimpan tapi tidak masuk ekspor marketing
      await post({ ...good, email: 'sari@toko.id', marketing: false });
      assert.ok(!cli().stdout.includes('sari@toko.id'), 'tanpa opt-in tidak boleh masuk ekspor marketing');
      assert.ok(cli('--all').stdout.includes('sari@toko.id'));

      // Berhenti berlangganan: GET hanya konfirmasi, POST yang mengeksekusi
      const tok = unsub[1];
      const g = await fetch('http://localhost:3301/api/berhenti?t=' + tok);
      assert.strictEqual(g.status, 200);
      assert.ok(cli().stdout.includes('budi@perusahaan.co.id'), 'GET tidak boleh berhenti-berlangganan otomatis');
      const p = await fetch('http://localhost:3301/api/berhenti?t=' + tok, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
      assert.strictEqual(p.status, 200);
      assert.ok(!cli().stdout.includes('budi@perusahaan.co.id'), 'setelah berhenti tidak boleh ada di ekspor marketing');
      assert.strictEqual((await fetch('http://localhost:3301/api/berhenti?t=salah')).status, 400);

      // Opt-in ulang menghidupkan kembali
      await post({ ...good, email: 'budi@perusahaan.co.id', marketing: true });
      // (dibatasi 3x/hari per email; ini permintaan ke-3)
      assert.ok(cli().stdout.includes('budi@perusahaan.co.id'), 'persetujuan baru harus mengaktifkan lagi');

      // Hapus data
      assert.ok(cli('--delete', 'sari@toko.id').stdout.includes('Dihapus'));
      assert.ok(!cli('--all').stdout.includes('sari@toko.id'));
      // Kirim ulang email yang sama: notifikasi ditandai berulang
      const bR = calls.length;
      await post({ ...good, email: 'ulang@toko.id' });
      await post({ ...good, email: 'ulang@toko.id' });
      assert.ok(calls[bR + 1].body.subject.startsWith('Lead baru:') && calls[bR + 3].body.subject.startsWith('Lead berulang:') && calls[bR + 3].body.html.includes('minat tinggi'), 'notifikasi harus menandai lead berulang');

      // Rekomendasi Essential (<= 50 orang) dan slot > 0: promo Founding tampil lengkap
      const b0 = calls.length;
      const rE = await post({ ...good, email: 'kecil@toko.id', headcount: 50 });
      assert.strictEqual(rE.status, 200);
      const hE = calls[b0].body.html;
      assert.ok(hE.includes('Program Founding Customer') && hE.includes('Rp19.000.000') && hE.includes('Rp29.000.000') && hE.includes('3 dari 3'), 'promo Founding harus ada untuk Essential');
      assert.ok(hE.includes(encodeURIComponent('slot Founding Customer Winaya (Essential Rp19jt)')), 'tautan WhatsApp Founding harus terisi');

      // Slot habis (FOUNDING_SLOTS_LEFT=0): blok promo hilang dari email
      const before = calls.length;
      const srv2 = spawn('node', ['server.js'], { env: { ...env, PORT: '3302', FOUNDING_SLOTS_LEFT: '0', DB_PATH: dbFile + '.2' } });
      await new Promise((r) => setTimeout(r, 1200));
      const r2 = await fetch('http://localhost:3302/api/kirim-rincian', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://winaya.id' }, body: JSON.stringify({ ...good, email: 'penuh@toko.id', headcount: 50 }) });
      srv2.kill();
      assert.strictEqual(r2.status, 200);
      assert.ok(calls.length > before && !calls[before].body.html.includes('Founding'), 'promo Founding harus hilang saat slot habis');
      // Tim > 50 orang (rekomendasi Complete): promo Founding tidak tampil
      const before2 = calls.length;
      const r3 = await fetch('http://localhost:3301/api/kirim-rincian', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://winaya.id' }, body: JSON.stringify({ ...good, email: 'besar@toko.id', headcount: 51 }) });
      assert.strictEqual(r3.status, 200);
      assert.ok(calls[before2].body.html.includes('<strong>Complete</strong>') && !calls[before2].body.html.includes('Founding'), 'promo Founding tidak boleh tampil untuk rekomendasi Complete');
      console.log('OK: validasi, simpan+normalisasi, tanpa duplikat, opt-in/ekspor, berhenti berlangganan (GET aman, POST eksekusi), hapus data');
    } catch (e) { console.error('GAGAL:', e.message); process.exitCode = 1; }
    srv.kill(); mock.close();
  }, 2500);
});
