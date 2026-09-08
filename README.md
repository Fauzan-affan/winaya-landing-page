# Winaya — Landing Page

Landing page statis satu halaman untuk **Winaya** (sistem absensi lapangan untuk perusahaan alih daya). Murni HTML + CSS + vanilla JS — tidak butuh build step, langsung deploy ke static hosting mana pun (Netlify, Vercel static, cPanel).

## Struktur file

```
index.html        — halaman utama (semua section)
style.css         — seluruh styling
script.js         — cross-fade video hero, FAQ accordion, chart, smooth scroll
videos/           — hero-scene-1.mp4, hero-scene-2.mp4, hero-scene-3.mp4 (belum ada — lihat di bawah)
images/           — hero-poster.jpg, favicon-16/32.png, apple-touch-icon.png, icon-192.png
favicon.ico       — favicon default di root (dibaca browser dari path /favicon.ico)
scripts/          — poster-source.html & favicon-source.html (sumber HTML untuk render ulang aset placeholder)
sitemap.xml       — sitemap satu halaman
robots.txt        — izinkan semua crawler
```

## Status aset hero saat ini

`images/hero-poster.jpg` **sudah ada** — placeholder bermerek (wordmark Winaya + tagline di atas navy/teal) yang di-render dari `scripts/poster-source.html` lewat headless screenshot (`npx capture-website-cli`), tanpa perlu credits Higgsfield. Ini sengaja dipakai sementara supaya hero, fallback `<img>`, dan preview share (WhatsApp/OG/Twitter) tidak 404 sebelum video asli tersedia.

`videos/hero-scene-1.mp4`, `hero-scene-2.mp4`, `hero-scene-3.mp4` **belum ada** — generate Seedance di Higgsfield masih terblokir karena workspace masih free plan (0 credits, butuh ~54 credits/video 6 detik 1080p = 162 credits total). Setelah top-up:

## Cara update video hero (setelah credits Higgsfield tersedia)

1. Generate 3 video via Seedance 2.0 (Higgsfield) memakai 3 prompt di dokumen spesifikasi (§4.1) — 16:9, 4–6 detik, tanpa audio.
2. Kompres ke H.264, maksimal ~3–5 MB per file. Contoh dengan ffmpeg:
   ```
   ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow -an -movflags +faststart videos/hero-scene-1.mp4
   ```
3. Taruh file di `videos/` dengan nama yang sesuai — tidak perlu mengubah kode.
4. Ganti poster placeholder dengan frame asli dari scene 1:
   ```
   ffmpeg -i videos/hero-scene-1.mp4 -vf "select=eq(n\,0)" -frames:v 1 -q:v 3 images/hero-poster.jpg
   ```
   Poster JPG idealnya tetap 16:9 (mis. 1920x1080) — dipakai juga sebagai `og:image`/`twitter:image`, jadi ukurannya sudah dideklarasikan di `<head>` (`og:image:width`/`height` = 3840x2160 untuk placeholder saat ini; update angka ini kalau dimensi frame video berbeda).

## Favicon

`favicon.ico` (root) + `images/favicon-16.png`, `images/favicon-32.png`, `images/apple-touch-icon.png`, `images/icon-192.png` sudah ada — wordmark "W" + titik teal di atas navy, konsisten dengan brand mark di poster/navbar. Untuk regenerate (mis. ganti desain):

```
npx --yes capture-website-cli scripts/favicon-source.html --output=images/favicon-512.png --width=512 --height=512 --overwrite --type=png
npm install --no-save sharp png-to-ico
node -e "
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
(async () => {
  await sharp('images/favicon-512.png').resize(32,32).toFile('images/favicon-32.png');
  await sharp('images/favicon-512.png').resize(16,16).toFile('images/favicon-16.png');
  await sharp('images/favicon-512.png').resize(180,180).toFile('images/apple-touch-icon.png');
  await sharp('images/favicon-512.png').resize(192,192).toFile('images/icon-192.png');
  fs.writeFileSync('favicon.ico', await pngToIco(['images/favicon-16.png','images/favicon-32.png']));
})();
"
```

## Cara ganti data harga

- **Harga tier** (§4.11): edit angka di section `#harga` di `index.html`, dan harga di JSON-LD (`"price": "29000000"`) di `<head>`.
- **Chart perbandingan biaya** (§4.5): edit array `data` di `script.js` bagian `initChart()` (satuan: Rp juta), dan angka di teks section `#perbandingan-biaya` di `index.html` supaya konsisten.
- **Tabel kompetitor** (§4.9): edit langsung di `index.html`, lalu perbarui tanggal di catatan kaki ("per Agustus 2026").
- **Nomor WhatsApp**: cari-ganti `6281311699123` di `index.html` (ada di navbar, hero, 3 tombol pricing, section langkah, dan footer).

## Checklist SEO sebelum publish

- [ ] Ganti `https://winaya.id/` di `<link rel="canonical">`, `sitemap.xml`, `robots.txt`, `og:url`, `og:image`, `twitter:image`, dan JSON-LD `Organization.url` dengan domain final (cari-ganti string `winaya.id`).
- [ ] Generate video hero asli (lihat "Status aset hero saat ini" di atas) dan ganti poster placeholder dengan frame asli — update `og:image:width`/`height` kalau dimensinya beda dari 3840x2160.
- [ ] Verifikasi ulang harga kompetitor di tabel §4.9 (harga bisa berubah — footnote menyebut "Agustus 2026"); kolom "Gadjian / Hadirr" sengaja dipisah dari Talenta karena Hadirr adalah produk Fast8/Gadjian, bukan Mekari — jangan digabung lagi.
- [ ] Deploy, lalu submit `sitemap.xml` ke Google Search Console.
- [ ] Jalankan Lighthouse (mobile) — video hero adalah penyebab paling umum skor performa turun; pastikan tiap file ≤ 5 MB dan `preload="metadata"` tetap terpasang.
- [ ] Cek kontras teks di atas navy memenuhi WCAG AA (sudah didesain demikian; jangan menurunkan opacity overlay hero di bawah nilai sekarang).
- [ ] Uji preview link WhatsApp/social share dengan domain final aktif (mis. lewat Facebook Sharing Debugger atau ngrok saat masih di localhost) — crawler share butuh URL yang benar-benar publik, tidak bisa membaca `localhost`.
