# Winaya Design System

Sistem visual landing page **winaya.id** (tema terang krem, versi September 2026).
Semua nilai diambil langsung dari `style.css`, `index.html`, dan `script.js`, jadi yang tertulis di sini sama dengan yang dirender di situs.

Versi visual dengan komponen hidup: https://claude.ai/artifact/Ma8Yqj3Vk3DxoHkAJbjUnq

---

## Daftar isi

1. [Prinsip](#1-prinsip)
2. [Warna](#2-warna)
3. [Kontras](#3-kontras)
4. [Peralihan section](#4-peralihan-section)
5. [Tipografi](#5-tipografi)
6. [Ruang, lebar, dan bentuk](#6-ruang-lebar-dan-bentuk)
7. [Komponen](#7-komponen)
8. [Gerak dan animasi](#8-gerak-dan-animasi)
9. [Voice dan copy](#9-voice-dan-copy)
10. [Founding Customer Program](#10-founding-customer-program)
11. [Jebakan teknis](#11-jebakan-teknis)
12. [Cek sebelum rilis](#12-cek-sebelum-rilis)

---

## 1. Prinsip

| Prinsip | Artinya |
|---|---|
| **Terang, bukan dingin** | Section tengah memakai krem `#F3EEE0`, bukan putih. Nuansanya membantu HR dalam keseharian, bukan dasbor korporat yang kaku. |
| **Minimal seperti FAQ** | Kartu, tabel, dan harga cukup garis 1px dan jarak yang lega. Tanpa glass, tanpa bayangan tebal. Hover hanya menebalkan garis dan memberi tint hijau tipis. |
| **Tanpa garis pemisah** | Peralihan antar dunia selalu bergradasi: hero ke krem, ilustrasi ke badan kartu, scrim navbar ke section. Batas keras dianggap bug. |

Struktur halaman: **hero gelap** → **stats bar, Perbandingan Biaya, Fitur Utama, Founding, Harga, FAQ, CTA akhir (semua krem)** → **footer gelap**.

---

## 2. Warna

Dua dunia berbagi satu aksen. Dunia gelap hanya untuk hero dan footer; semua section di antaranya krem.

### Dunia terang (section tengah)

| Nama | Token | Nilai | Pemakaian |
|---|---|---|---|
| Krem | `--bg-page-alt` | `#F3EEE0` | Latar semua section dari stats bar sampai CTA akhir |
| Krem muda | `--bg-page` | `#FBF8F1` | Cadangan permukaan lebih terang |
| Sage muda | (tanpa token) | `#EEF3E6` | Puncak gradasi ilustrasi kartu fitur |
| Tinta | `--ink-dark` | `#23301E` | Heading, harga, teks utama di krem |
| Tinta lembut | `--ink-dark-soft` | `rgba(35, 48, 30, 0.68)` | Paragraf, label, isi tabel, footnote |
| Garis | `--border-onlight` | `rgba(35, 48, 30, 0.14)` | Pembatas kartu, tabel, FAQ |
| Garis tegas | (tanpa token) | `rgba(35, 48, 30, 0.28)` | Header tabel, border kartu saat hover |

### Aksen

| Nama | Token | Nilai | Pemakaian |
|---|---|---|---|
| Daun | `--accent` | `#6FB25A` | Isi tombol primer, bullet centang, border kartu unggulan. **Bukan untuk teks di krem.** |
| Daun terang | `--accent-bright` | `#8FD673` | Teks aksen di latar gelap, hover tombol primer |
| Hutan | `--accent-dark` | `#4C8A3C` | Eyebrow, nama tier, segmen klien, angka statistik di krem |
| Hutan tua | (tanpa token) | `#3E7530` | Khusus latar dengan teks putih kecil (banner founding) |
| Amber | (tanpa token) | `#8A5A0B` | Hanya angka urgensi biaya langganan, di atas `rgba(240, 185, 74, 0.1)` |
| Tint hijau | (tanpa token) | `rgba(111, 178, 90, 0.05–0.08)` | Hover kartu (5%), kolom Winaya di tabel (7%), kartu founding (8%) |

### Dunia gelap (hero dan footer)

| Nama | Token | Nilai | Pemakaian |
|---|---|---|---|
| Malam | `--bg-deep` | `#000000` | Latar hero, footer, overlay video |
| Panel | `--bg-panel` | `#12171A` | Mockup HP, chip fitur hero, tooltip chart |
| Putih hangat | `--white` | `#F5F8F6` | Heading hero, tombol navbar |
| Tinta terang | `--ink` | `#EAF0EC` | Teks di dunia gelap |
| Warna temu | (tanpa token) | `#2E2C24` | Titik temu gradasi hero ke stats bar, harus identik di kedua sisi |

---

## 3. Kontras

Rasio dihitung dengan rumus luminans relatif WCAG 2.1. AA teks normal butuh **4,5:1**; teks besar (minimal 18,66px tebal atau 24px) cukup **3:1**.

| Pasangan | Rasio | Status | Aturan pakai |
|---|---|---|---|
| Tinta `#23301E` di krem | 12,0 : 1 | AA | Teks utama, harga, heading |
| Tinta lembut 68% di krem | 4,6 : 1 | AA | Batas bawah untuk paragraf. Jangan turunkan opasitasnya lagi |
| Hutan `#4C8A3C` di krem | 3,6 : 1 | Teks besar saja | Aman untuk heading dan label tebal. **Eyebrow 12,8px masih di bawah AA normal, perlu revisi** |
| Amber `#8A5A0B` di krem | 5,1 : 1 | AA | Angka urgensi |
| Putih di hutan tua `#3E7530` | 5,5 : 1 | AA | Banner. `#4C8A3C` hanya 4,2:1, jangan dipakai untuk teks putih kecil |
| `#08120A` di daun `#6FB25A` | 7,5 : 1 | AA | Tombol primer. Teks tombol hijau selalu gelap, bukan putih |
| Daun `#6FB25A` di krem | 2,2 : 1 | **Gagal** | Jangan. Untuk teks hijau di krem pakai Hutan |
| Daun terang `#8FD673` di hitam | 12,0 : 1 | AA | Aksen di hero dan footer |

---

## 4. Peralihan section

Hero gelap ke stats bar krem memakai **dua ramp yang bertemu di satu warna pekat**:

| Elemen | Tinggi | Dari | Ke |
|---|---|---|---|
| `.hero::after` | 300px terbawah hero | transparan (hitam hero) | `#2E2C24` pekat |
| `.stats-bar::after` | 230px teratas stats bar | `#2E2C24` pekat | transparan (krem) |

Nada tengah ramp stats bar hangat kecokelatan (`rgba(110, 104, 84, 0.72)` → `rgba(215, 203, 172, 0.2)`) agar tidak terbaca sebagai pita abu-abu.

> **Kenapa bukan satu overlay transparan:** di titik batas, alpha overlay sama tetapi dasarnya berbeda (hitam dan krem), sehingga selisih dasar itu bocor dan justru membentuk garis baru. Titik temu harus opak.

Pola yang sama dipakai di **hover kartu fitur**: `.fitur-illustration::after` memberi tint hijau bergradasi (0% di 40%, 2,5% di 70%, 5% di dasar) yang tepat sama dengan tint badan kartu di garis batas.

---

## 5. Tipografi

**Poppins** untuk semuanya, bobot 400 sampai 800. Hierarki dibangun lewat ukuran, bobot, dan letter-spacing, bukan dengan menambah typeface.

```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
--font: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
```

| Peran | Ukuran | Bobot dan detail | Contoh |
|---|---|---|---|
| H1 hero | `clamp(1.9rem, 4.5vw, 3.1rem)` | 500, line-height 1.2, putih | Software Absensi Karyawan Lapangan |
| H2 section | `clamp(1.5rem, 3.2vw, 2.2rem)` | 600, line-height 1.2 | Bayar Sekali, Software Jadi Milik Anda Selamanya |
| Sub-heading grup | `clamp(1.35rem, 2.6vw, 1.85rem)` | 700, letter-spacing -0.01em | Winaya sebagai Alternatif Kerjoo, Talenta, dan Software HR Langganan |
| Angka urgensi | `clamp(2.2rem, 4.6vw, 3.1rem)` | 800, letter-spacing -0.02em, amber | Rp 19 jt/tahun |
| Angka statistik | `clamp(1.6rem, 3.4vw, 2.3rem)` | 700, hutan di krem | 4 minggu |
| Harga kartu | `1.7rem` | 700, tinta | Rp 29.000.000 |
| Harga founding | `clamp(2rem, 4vw, 2.6rem)` | 800, letter-spacing -0.02em | Rp19.000.000 |
| H3 kartu | `1.02rem` sampai `1.1rem` | 600 | Kode yang Kedaluwarsa dalam 90 Detik |
| Eyebrow | `0.8rem` | 700, letter-spacing 0.14em, uppercase, hutan | PERBANDINGAN BIAYA |
| Body | `1rem` | 400, line-height 1.65, tinta lembut | Clock-in tersimpan aman di device saat sinyal hilang |
| Label/nama tier | `0.85rem` | 600, letter-spacing 0.12em | ESSENTIAL |
| Microcopy | `0.7rem` | 400, tinta lembut | Slot baru terhitung saat kesepakatan tertulis ditandatangani. |
| Footnote | `0.68rem` | 400, **selalu diawali `*`** | *Ilustrasi untuk tim 100 orang. |

### Format angka

| Konteks | Format |
|---|---|
| Harga resmi | `Rp29.000.000` (titik ribuan) |
| Ringkasan | `Rp29jt`, `Rp 19 jt/tahun` |
| Rentang | en dash tanpa spasi: `Rp200–400jt` |
| Harga per karyawan | `Rp19.175/karyawan/bln` |

---

## 6. Ruang, lebar, dan bentuk

### Jarak

| Nilai | Pemakaian |
|---|---|
| `8px` | Jarak navbar ke banner |
| `14px` | Gap badge, footnote ke konten |
| `22px` | Gap grid kartu, padding kartu |
| `40px` | Padding kartu founding, intro ke grid |
| `56px` | Padding vertikal section (mobile) |
| `80px` | Padding vertikal section (desktop) |

### Lebar

| Elemen | Lebar maksimum |
|---|---|
| `.container` | 1140px, padding samping 20px |
| `.container-narrow` (FAQ) | 860px |
| Navbar pill dan banner | 1100px |

### Breakpoint

| Breakpoint | Perubahan |
|---|---|
| `max-width: 960px` | Grid jadi satu kolom, chart tidak sticky, kartu founding satu kolom |
| `max-width: 640px` | Link navbar disembunyikan, teks banner versi pendek, padding section 56px |

### Radius

| Nilai | Pemakaian |
|---|---|
| `999px` | **Semua** tombol, badge, navbar, banner. Tidak ada tombol kotak |
| `20px` (`--radius`) | Kartu, callout, kartu founding |
| Tanpa radius | FAQ dan baris tabel: hanya garis bawah |

---

## 7. Komponen

### Tombol

| Class | Latar | Teks | Hover | Konteks |
|---|---|---|---|---|
| `.btn-primary` | `#6FB25A` | `#08120A` | `#8FD673`, naik 1px, bayangan `0 10px 28px rgba(111,178,90,.35)` | Semua dunia |
| `.btn-outline-dark` | transparan, border 2px `#6FB25A` | `#4C8A3C` | terisi `#6FB25A`, teks `#08120A` | Krem |
| `.btn-outline` | transparan, border 2px `rgba(255,255,255,.3)` | `#F5F8F6` | border dan teks `#8FD673` | Hero |
| `.btn-nav` | `#F5F8F6` | `#12171A` | `brightness(0.92)` | Navbar |

Aturan:
- Padding dasar `12px 24px`, `.btn-lg` `15px 30px`, font 700.
- Semua CTA menuju WhatsApp `6281311699123` dengan pesan terisi yang menyebut tier dan harganya, contoh: `Halo, saya tertarik dengan Winaya tier ESSENTIAL (Rp29jt). Bisa jadwalkan konsultasi?`
- Kursor tetap `pointer` hanya pada elemen interaktif; teks biasa memakai kursor default.

### Badge dan label

| Jenis | Gaya | Aturan |
|---|---|---|
| Solid (`.badge`) | Gradasi `#8FD673` → `#4C8A3C`, teks `#08120A`, 0.7rem, letter-spacing 0.1em, menggantung `top: -14px` | **Maksimal satu per section** (PALING DIREKOMENDASIKAN) |
| Outline (`.founding-badge`) | Border 1px `#4C8A3C`, teks `#4C8A3C`, 0.62rem | Sebaris dengan nama tier agar harga antar kartu tetap sejajar |
| Hero (`.hero-badge`) | Tint `rgba(143,214,115,.1)`, border 30%, teks `#8FD673` | Hanya di hero |
| Slot (`.founding-slots`) | Border 1px `rgba(76,138,60,.45)`, angka hutan | Angka ditulis manual |

### Navbar

- Pill gelap melayang, `position: fixed`, max-width 1100px, radius 999px.
- Latar `linear-gradient(135deg, rgba(20,28,24,.82), rgba(10,15,13,.78))`, border `rgba(255,255,255,.16)`, `backdrop-filter: blur(16px)`.
- **Scrim** (`.navbar::before`, 130px) berganti warna mengikuti section yang dilewati:
  - di hero dan footer: gradasi gelap `rgba(6,9,8,.85)` → transparan
  - di section terang (class `on-light`): gradasi krem `rgba(243,238,224,.96)` → transparan
- Class `on-light` dihitung **tiap scroll** (di-throttle `requestAnimationFrame`), bukan sekali saat load, karena tinggi halaman berubah setelah chart dan video dirender. Stats bar baru dihitung terang setelah ramp gelap 230px-nya lewat.
- Di dunia terang, bayangan pill memakai tinta hangat: `0 10px 30px rgba(35,48,30,.16), 0 2px 6px rgba(35,48,30,.08)`.

### Kartu fitur

- Transparan di atas krem, border 1px `--border-onlight`, radius 20px, `flex: 1 1 320px; max-width: 356px`.
- Grid memakai flex-wrap dan `justify-content: center` supaya baris terakhir yang tidak penuh tetap di tengah.
- Ilustrasi SVG `viewBox="0 0 320 170"`, latar gradasi `#EEF3E6` → `#F3EEE0` (dasar sama dengan krem), aksen `#4C863C`, garis `#3E5136`.
- Body diawali segmen klien Permenaker: `<span class="fitur-segment">Untuk klien tambang, migas, dan kelistrikan:</span>`.
- Hover: border `rgba(35,48,30,.3)`, latar `rgba(111,178,90,.05)`, ilustrasi `scale(1.04)`, overlay gradasi di ilustrasi (lihat bagian 4).

### Kartu harga

- Sama minimalnya dengan kartu fitur. Kartu unggulan (`.pricing-featured`): tint 7% dan border 1px `#6FB25A`, tanpa scale dan tanpa bayangan.
- Bullet fitur: centang `#6FB25A` via `mask`.
- Harga dianimasikan hitung naik saat masuk viewport.

### Tabel perbandingan

- Tanpa latar, `border-collapse: collapse`, font 0.88rem, `min-width: 760px` di dalam `.table-wrap` yang scroll horizontal sendiri.
- Header uppercase 0.75rem, garis bawah 28%; baris biasa garis 14%; **baris terakhir tanpa garis**.
- Kolom Winaya satu-satunya yang diberi tint (`rgba(111,178,90,.07)`) dan teks hutan tebal.
- Data kompetitor hanya dari sumber publik; bila harga tidak dipublikasikan tulis `Tidak diumumkan · hubungi sales`.

### Chart biaya (Chart.js)

| Elemen | Nilai |
|---|---|
| Font | Poppins |
| Batang subscription | `rgba(35,48,30,.16)`, hover 26% |
| Batang Winaya | Gradasi `#7FC963` → `#4C863C`, hover `#5C9C49` |
| Grid | `rgba(35,48,30,.1)`, putus-putus `[3, 4]` |
| Tick dan label | `rgba(35,48,30,.5)` dan `.72` |
| Tooltip | Latar `#23301E`, border `rgba(111,178,90,.45)`, teks putih |
| Radius batang | 8px, `maxBarThickness: 56` |

- Latar chart transparan, menyatu dengan section.
- Desktop: chart di kiri dan **sticky** di `top: 100px`, teks di kanan. Sticky hanya bekerja bila kolom teks lebih tinggi dari chart.
- Batang tumbuh mengikuti posisi scroll (`easeOutCubic`), bukan animasi waktu.

### Callout urgensi

- Latar `rgba(240,185,74,.1)`, border `rgba(160,107,18,.24)`, radius 20px, padding `18px 20px`.
- Angka amber 800 dengan ikon tren 34px. **Satu-satunya pemakaian amber di halaman.**

### FAQ

- Acuan untuk semua komponen minimal lain: hanya garis bawah 1px per item.
- Pertanyaan 1rem bobot 700, ikon `+` hutan yang berputar 45° saat terbuka.
- Setiap item wajib juga ada di JSON-LD `FAQPage` dengan urutan dan teks yang sama.

### Footer

- Latar hitam, watermark "Winaya" `25vw` dengan `rgba(255,255,255,.06)`.
- Baris bawah: copyright, Syarat & Ketentuan, Kebijakan Privasi, ikon WhatsApp.

---

## 8. Gerak dan animasi

| Animasi | Detail | Tujuan |
|---|---|---|
| Hitung angka | Naik dari 0 ke target saat masuk viewport, 1,4 detik | Menarik perhatian ke angka biaya |
| Chart scroll | Tinggi batang mengikuti progres scroll | Membuat perbandingan terasa bertambah |
| Hover tombol | Naik 1px + bayangan hijau, 0,2 detik | Umpan balik |
| Hover kartu | Border dan tint, 0,25 detik; ilustrasi `scale(1.04)` 0,35 detik | Umpan balik tanpa berlebihan |
| Scrim navbar | Transisi latar 0,4 detik saat pindah dunia | Tidak ada kedipan |
| **Banner founding: kilau** | Sorotan putih 16% menyapu dari kiri ke kanan, sekali tiap **7 detik** (sapuan 22% durasi, sisanya jeda) | Membuat banner disadari tanpa berkedip terus |
| **Banner founding: titik** | Titik `#B9EFA3` 7px dengan cincin yang membesar ke 2,8× dan memudar, siklus **2,4 detik** | Penanda "aktif" yang tenang |

Aturan:
- Semua animasi dimatikan untuk `prefers-reduced-motion: reduce`; angka langsung tampil penuh.
- Konten yang perlu dibaca tidak pernah disembunyikan menunggu animasi.
- Tidak ada countdown, popup, exit-intent, atau kedip cepat.

---

## 9. Voice dan copy

Pembaca adalah pemilik atau HRD perusahaan alih daya. Bahasa Indonesia baku, langsung ke masalah operasional mereka.

| Aturan | Pakai | Hindari |
|---|---|---|
| **Baku dan menyapa "Anda"**, tanpa slang, emoji, atau tanda seru beruntun | Pilih tier yang sesuai kebutuhan Anda sekarang. | Buruan, promo terbatas!!! |
| **Tanpa em dash** (`—`). Ganti dengan titik dua, koma, atau kalimat baru. En dash hanya untuk rentang angka | Tiga Slot Founding Customer: Harga Khusus, Syarat Mudah | Tiga Slot Founding Customer — Harga Khusus |
| **Angka selalu dengan hitungannya**: harga normal, harga baru, selisih | Rp19.000.000 dari Rp29.000.000, selisih Rp10.000.000. | Hemat besar-besaran. |
| **Hook dari rasa sakit pelanggan**, disertai segmen Permenaker yang paling membutuhkan | Untuk klien tambang, migas, dan kelistrikan: lokasi tanpa sinyal bukan masalah. | Fitur offline canggih. |
| **Kelangkaan yang jujur**. Slot yang habis dicabut, bukan di-reset | Slot tersisa: 3 dari 3 | Penawaran berakhir dalam 02:14:09 |
| **Antitesis bila natural** | Beli sekali, bukan sewa bulanan. | Pola "bukan X" di setiap kalimat |
| **Halus saat membahas risiko**: posisikan pelanggan awal sebagai mitra | Harga ini merupakan bentuk apresiasi kami atas kepercayaan tersebut. | Anda mengambil risiko lebih besar. |
| **Syarat kontrak di dokumen, bukan di halaman**: kewajiban seperti studi kasus dan testimoni dibahas di NDA atau perjanjian | Harga khusus, syarat mudah. | Ditukar kesediaan jadi studi kasus. |
| **Singkat dan pokok**: satu gagasan per kalimat, one-liner untuk hook | Berhenti mengejar absensi tim di puluhan lokasi. | Paragraf panjang di hero |
| **Jujur soal batas cakupan** | Belum, dan kami sebutkan ini terang-terangan. | Mengklaim fitur yang belum ada |

Kata yang dilarang: *diskon gila*, *promo terbatas*, *buruan*, dan klaim yang tidak bisa dibuktikan.

---

## 10. Founding Customer Program

Program sementara: 3 slot pertama tier Essential **Rp19.000.000** (normal Rp29.000.000, selisih Rp10.000.000, sekitar 34%).

### Elemen di halaman

| Elemen | Lokasi | Catatan |
|---|---|---|
| Banner `#founding-banner` | Di bawah navbar pill, ikut fixed | Latar `#3E7530`, teks putih 0.84rem, kilau dan titik berdenyut. Mobile: teks versi pendek |
| Section `#founding` | Setelah Fitur Utama, sebelum Harga | Eyebrow "Launching Program", dua poin: Penawaran dan Latar Belakang Program |
| Kartu penawaran | Di dalam `#founding` | Tint 8%, border `rgba(76,138,60,.35)`, harga normal dicoret 2px |
| Badge dan catatan | Kartu Essential di Harga | Badge outline sebaris nama tier; catatan "lihat detailnya di atas" |
| FAQ | Setelah item onboarding | Termasuk entri JSON-LD `FAQPage` |

### Aturan

- Angka **"Slot tersisa: 3 dari 3"** di-hardcode di HTML dan diperbarui manual. Tidak pernah dihitung JavaScript.
- Harga di JSON-LD `SoftwareApplication` tetap `29000000`. `<title>` dan meta description tidak menyebut promo.
- Selama banner ada, `:has(#founding-banner)` memperpanjang scrim navbar (175px, mobile 150px) dan menambah padding atas hero (170px, mobile 150px). Keduanya kembali otomatis saat banner dihapus.

### Saat slot habis

Hapus semua blok bertanda `HAPUS ... SAAT SLOT HABIS`:

1. Banner `#founding-banner` di `index.html`
2. Section `#founding`
3. Badge `HARGA FOUNDING TERSEDIA` dan baris catatan di kartu Essential
4. Item FAQ founding **dan** entri JSON-LD-nya
5. Blok CSS **FOUNDING CUSTOMER PROGRAM** di akhir `style.css`

Program dicabut, bukan di-reset atau dibuka lagi dengan nama lain.

---

## 11. Jebakan teknis

| Masalah | Penyebab | Solusi |
|---|---|---|
| Teks di kartu harga salah warna/ukuran | Kartu harga juga ber-class `.card`, sehingga `.card p` (0,0,1,1) mengalahkan selector satu class seperti `.price` | Pakai dua class: `.pricing-card .price` |
| `position: sticky` tidak bekerja | `overflow-x: hidden` pada `html`/`body` membuat scroll container baru | Pakai `overflow-x: clip; overflow-y: visible` |
| Scrollbar hijau/hitam muncul di tabel dan footnote | `scrollbar-color` pada `html` diwariskan ke semua elemen scrollable | Override per elemen, contoh `.table-wrap` |
| Chart sticky tidak menempel | Kolom chart lebih tinggi dari kolom teks, jadi tidak ada jarak untuk menempel | Kolom teks harus lebih tinggi dari chart |
| Aturan paragraf ikut mengecilkan angka stat | Selector `.chart-text p` juga mengenai `<p>` di dalam callout | Pakai child selector `.chart-text > p` |
| Gradasi antar section membentuk garis baru | Overlay semi-transparan melewati batas dua dasar warna berbeda | Dua ramp yang bertemu di satu warna opak |
| Status `on-light` navbar salah | Posisi section diukur sekali sebelum chart/video selesai render | Ukur ulang tiap scroll |

---

## 12. Cek sebelum rilis

Setiap push ke `main` langsung terdeploy ke winaya.id lewat GitHub Actions, jadi daftar ini dilalui sebelum commit.

- [ ] Tidak ada garis pemisah di batas hero ke stats bar dan saat hover kartu fitur
- [ ] Teks hijau di krem memakai Hutan `#4C8A3C`, bukan Daun `#6FB25A`
- [ ] Tidak ada em dash di teks yang terlihat (masih ada satu di mockup hero, placeholder "Masuk")
- [ ] FAQ dan JSON-LD `FAQPage` identik: jumlah, urutan, dan teks jawaban
- [ ] Harga di JSON-LD `SoftwareApplication` tetap `29000000`
- [ ] Angka slot founding sudah sesuai kenyataan
- [ ] Dicek di lebar 375px: banner tidak menutup hero, tabel scroll di wadahnya sendiri
- [ ] Animasi mati dengan `prefers-reduced-motion`
- [ ] Semua link WhatsApp terbuka dengan pesan terisi yang benar
