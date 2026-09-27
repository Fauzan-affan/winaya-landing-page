# winaya-mailer

Layanan kecil di balik tombol "Kirim PDF ke Email" di kalkulator winaya.id.

Alur: pengunjung mengisi **email saja** (+ persetujuan) → server **menghitung ulang** angka dari
input mentah kalkulator → membuat PDF A4 (pdfkit) → mengirimnya lewat [Resend](https://resend.com)
→ **menyimpan email di database SQLite** untuk marketing → mengirim notifikasi lead ke `OWNER_EMAIL`.

## Endpoint
- `POST /api/kirim-rincian` — kirim PDF + simpan email.
- `GET|POST /api/berhenti?t=TOKEN` — berhenti berlangganan (GET hanya konfirmasi, POST yang mengeksekusi;
  mendukung one-click `List-Unsubscribe`).
- `GET /api/health` — cek hidup.

## Data email (dapat diakses kapan saja)
Tabel `subscribers` di `/data/subscribers.db`: email (huruf kecil, unik), waktu daftar, jumlah permintaan,
status persetujuan marketing, waktu berhenti, dan input/estimasi kalkulator terakhir (untuk segmentasi).

```bash
docker compose exec winaya-mailer node export.js            > email-marketing.csv   # hanya yang opt-in & belum berhenti
docker compose exec winaya-mailer node export.js --all      > semua-email.csv
docker compose exec winaya-mailer node export.js --stats
docker compose exec winaya-mailer node export.js --delete nama@contoh.com          # permintaan penghapusan data
```
**Kirim marketing hanya ke hasil `export.js` tanpa `--all`**: itu daftar yang menyetujui dan belum berhenti.
Pengunjung yang tidak mencentang persetujuan marketing tetap tersimpan (untuk mencegah pengiriman ganda dan
menghormati permintaan berhenti), tetapi tidak boleh dikirimi promosi.
**Backup**: `docker compose exec -T winaya-mailer node backup.js` membuat salinan harian di `data/backups/` (simpan 14 hari). Jadwalkan lewat cron bila perlu; salin juga ke luar VPS secara berkala.

## Keamanan
Validasi ketat (email, persetujuan, whitelist metode/gaji, batas asumsi), honeypot, cek Origin,
rate limit 5 permintaan/jam/IP dan 3 email/hari/alamat, ekspor CSV anti formula-injection, teks di email di-escape.
Alamat email tidak ditulis ke log. `RESEND_API_KEY` kosong + bukan production = dry-run (PDF ke `out/`).

## Uji lokal
```bash
npm install
npm test                          # memakai Resend tiruan + database sementara
PORT=3100 node server.js          # dry-run, database di ./data/
```

## Pasang di production
1. **Resend**: buat akun, tambahkan domain `winaya.id`, pasang record DNS (SPF, DKIM, opsional DMARC) di hPanel,
   tunggu *Verified*, buat API key (*Sending access*).
2. **VPS**: salin folder ini ke `/opt/winaya-mailer`, buat `.env` dari `.env.example`, `chmod 600 .env`,
   `mkdir -p data`.
3. **Compose** (jaringan sama dengan Caddy, tanpa publish port):
   ```yaml
   winaya-mailer:
     build: /opt/winaya-mailer
     restart: unless-stopped
     env_file: /opt/winaya-mailer/.env
     volumes:
       - /opt/winaya-mailer/data:/data
   ```
4. **Caddy**, di blok `winaya.id` sebelum `file_server`:
   ```
   handle /api/* {
     reverse_proxy winaya-mailer:3000
   }
   ```
5. Uji: `curl https://winaya.id/api/health` → `{"ok":true}`, lalu kirim dari kalkulator.

Database ini **terpisah** dari database HR system (hr.winaya.id); jangan dicampur.
