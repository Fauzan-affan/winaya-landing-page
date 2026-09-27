# Draf Email Marketing Winaya: Dari Hasil Kalkulator ke Pembelian

Tujuan: setiap orang yang memasukkan email di kalkulator winaya.id tidak berhenti di PDF. Mereka
dibimbing, dengan urutan yang jujur dan tidak memaksa, dari "melihat angka kerugian" ke
"berkonsultasi" lalu "membeli paket".

Status: **draf**. Yang sudah berjalan otomatis hanya Email 0 (pengiriman PDF). Email 1 sampai 6
belum dikirim otomatis oleh sistem; lihat bagian 7 untuk cara menjalankannya.

---

## 1. Ringkasan riset

| Temuan | Yang dipakai di draf ini |
|---|---|
| Rata-rata B2B menanggapi lead setelah **47 jam**, tim terbaik **di bawah 5 menit**. Menghubungi dalam 5 menit membuat peluang menjadi opsi penjualan hingga **21 kali** lebih besar dibanding setelah 30 menit; memindahkan respons dari 24 jam ke di bawah 5 menit menaikkan angka closing dari sekitar 12% ke 32% tanpa mengubah penawaran ([Kixie](https://www.kixie.com/sales-blog/speed-to-lead-response-time-statistics-that-drive-conversions/), [Artemis GTM](https://artemisgtm.ai/resources/research/speed-to-lead-benchmark-2026/), [Digital Applied](https://www.digitalapplied.com/blog/speed-to-lead-response-time-benchmarks-2026-data-playbook)) | Email 0 terkirim seketika dan memuat tombol WhatsApp. Tim menerima notifikasi lead saat itu juga dan **menyapa lewat WhatsApp dalam 1 jam kerja** (bagian 6). |
| Rangkaian nurture B2B umumnya **5 sampai 8 email dalam 21 sampai 30 hari** (hari 0, 3, 7, 12, 18, dst.), lebih rapat (3 sampai 4 hari) begitu lead menunjukkan minat ([Growthspree](https://www.growthspreeofficial.com/blogs/b2b-saas-b2b-email-nurture-benchmarks-2026-open-ctr-reply-conversion-by-sequence), [Martal](https://martal.ca/email-lead-nurturing/)) | 7 email (0 sampai 6) selama 25 hari. |
| Email pertama dalam rangkaian sambutan paling sering dibuka (**52 sampai 68%**), email ketiga turun ke 18 sampai 30%; benchmark B2B SaaS: buka median 34%, klik 4,8%, balasan 2,9% ([Growthspree](https://www.growthspreeofficial.com/blogs/b2b-saas-b2b-email-nurture-benchmarks-2026-open-ctr-reply-conversion-by-sequence)) | Email paling penting (hasil hitungan dan ajakan konsultasi) diletakkan di awal dan di akhir; pantau angka ini sebagai pembanding. |
| Subjek yang menyebut **masalah spesifik** mengungguli subjek promosi 30 sampai 60%; **satu pokok bahasan dan satu CTA** per email mengungguli email dengan banyak tautan ([Growthspree](https://www.growthspreeofficial.com/blogs/b2b-saas-b2b-email-nurture-benchmarks-2026-open-ctr-reply-conversion-by-sequence)) | Subjek memakai angka pengunjung sendiri; tiap email hanya satu CTA. |
| Alur yang efektif: pengantar, edukasi, **bukti sosial atau studi kasus** (hari 5 sampai 7), ajakan langsung (hari 9 sampai 10), email penutup; **keberatan harga** dijawab dengan data ROI ([Smashsend](https://smashsend.com/blog/email-drip-campaign-examples), [Mailmodo](https://www.mailmodo.com/guides/drip-campaign/)) | Email 2 (perbandingan biaya), Email 4 (keberatan umum), Email 5 (perhitungan balik modal). |

Catatan jujur: angka-angka di atas berasal dari blog dan laporan vendor pemasaran global
(sebagian dari rilis perusahaan alat penjualan), bukan riset independen dan bukan khusus Indonesia.
Anggap sebagai patokan awal, lalu ukur hasil Winaya sendiri. Pemilihan **WhatsApp sebagai saluran
utama** adalah penyesuaian saya untuk pasar Indonesia, bukan temuan dari riset di atas.

## 2. Prinsip yang dipakai

1. **Kecepatan menang atas kesempurnaan.** Sapaan manusia di WhatsApp pada jam pertama lebih berharga dari email terbaik.
2. **Angka mereka sendiri, bukan angka kita.** Setiap email merujuk pada estimasi milik pengunjung.
3. **Satu email, satu pesan, satu CTA.** CTA utama selalu WhatsApp (konsultasi), kecuali Email 2.
4. **Jujur soal batas.** Payroll/pajak/BPJS tidak termasuk, hosting berbayar terpisah, estimasi bukan angka pasti. Ini sesuai suara merek Winaya dan justru membangun kepercayaan.
5. **Tanpa urgensi palsu.** Tidak ada hitung mundur. Program Founding hanya disebut selama slot memang tersisa.
6. **Baku dan hangat.** Sapaan "Anda", tanpa slang, tanpa emoji, tanpa tanda seru beruntun, tanpa tanda pisah panjang.

## 3. Aturan pengiriman (wajib)

| Kelompok | Boleh menerima |
|---|---|
| Semua yang mengisi email | **Email 0 saja** (PDF yang mereka minta). |
| **Opt-in marketing** (mencentang kotak opsional) dan belum berhenti | Email 0 sampai 6. Ambil daftarnya dengan `node export.js` (tanpa `--all`). |
| Sudah berhenti berlangganan | Tidak menerima apa pun selain permintaan PDF baru yang mereka ajukan sendiri. |

- Setiap email memuat tautan **berhenti berlangganan** (sudah otomatis pada Email 0; wajib disalin ke Email 1 sampai 6).
- Berhenti dari rangkaian bila lead **membalas atau menghubungi lewat WhatsApp**: ia sudah masuk percakapan penjualan, bukan lagi otomatis.
- Alamat pengirim: `info@winaya.id`, pengirim personal: **Farah** ("Farah dari Winaya"). Email dari orang lebih sering dibalas daripada dari "Tim".

## 4. Data yang tersedia untuk personalisasi

Dari tabel `subscribers`: `email`, `last_headcount`, `last_method`, `last_salary`,
`last_estimate_low`, `last_estimate_high`, `request_count`. Turunan:

| Variabel | Isi |
|---|---|
| `{{jumlah_karyawan}}` | `last_headcount` |
| `{{metode}}` | Kertas / Fingerprint / WhatsApp / Aplikasi lain |
| `{{estimasi_bawah}}` `{{estimasi_atas}}` | `last_estimate_low` dan `last_estimate_high`, format Rp |
| `{{paket}}` `{{harga_paket}}` | Essential Rp29 juta (sampai 50 orang), Complete Rp45 juta (51 sampai 150), Enterprise Rp75 juta (di atas 150) |
| `{{bulan_balik_modal}}` | harga paket ÷ (estimasi tengah ÷ 12), dibulatkan; **tampilkan hanya bila kurang dari 12 bulan** |
| `{{link_berhenti}}` | tautan berhenti berlangganan milik penerima |

Bila `request_count` lebih dari 1 (menghitung berulang), itu sinyal minat tinggi: percepat ke Email 5.

## 5. Urutan email

Semua email: pengirim `Farah <info@winaya.id>`. Setiap email di bawah diakhiri
kalimat berhenti berlangganan yang sama:

> Anda menerima email ini karena mengisi kalkulator di winaya.id dan menyetujui informasi dari kami. [Berhenti berlangganan]({{link_berhenti}}) kapan saja.

### Email 0 · Hari 0 (seketika) · SUDAH BERJALAN
Tujuan: mengantar PDF dan mengajak konsultasi. Dikirim ke semua yang mengisi email.

- Subjek: `Potensi kerugian absensi Anda: sekitar {{estimasi_bawah_ringkas}} per tahun` (contoh: "sekitar Rp153,8 juta"; pengirim: Farah dari Winaya)
- Isi: kotak estimasi, rekomendasi paket dan (bila masuk akal) balik modal, **blok Program Founding Customer** (Essential Rp19 juta dari Rp29 juta, sisa slot, tombol **Amankan slot Founding**), tombol **Jadwalkan konsultasi via WhatsApp**, tautan **Lihat semua paket dan harga**, PDF terlampir.
- Blok Founding hanya tampil bila paket yang direkomendasikan adalah **Essential** (sampai 50 karyawan), karena programnya khusus Essential; ia tampil selama env `FOUNDING_SLOTS_LEFT` lebih dari 0 (default 3) dan diisi **manual**, sama seperti "Slot tersisa" di index.html. Saat slot habis isi 0: blok hilang dari email. Ubah di `.env` VPS lalu `docker compose up -d`.

### Email 1 · Hari 2 · Membaca hasil dengan benar
Tujuan: menambah nilai dan mengubah angka generik menjadi angka yang mereka percayai.

- Subjek A: `Tiga angka yang perlu Anda cek sebelum memercayai hasil hitungan`
- Subjek B: `{{estimasi_bawah}} per tahun: seberapa akurat untuk perusahaan Anda?`
- Preheader: `Kalkulator ini sengaja memakai asumsi yang bisa Anda ubah.`

> Yth. Bapak/Ibu,
>
> Dua hari lalu Anda menghitung potensi kerugian absensi untuk {{jumlah_karyawan}} karyawan dengan metode {{metode}}. Hasilnya berupa rentang, bukan angka pasti, karena tiga asumsi di dalamnya berbeda di setiap perusahaan:
>
> 1. **Kebocoran dari total payroll.** Selisih antara gaji yang dibayar dan kehadiran yang benar-benar terbukti. Cara mengecek: bandingkan absensi 1 sampai 3 bulan terakhir dengan bukti lapangan, lalu bagi selisihnya dengan total payroll.
> 2. **Jam admin rekap manual.** Total jam staf yang mengurus rekap sebulan, dibagi jumlah karyawan, dikali 10.
> 3. **Biaya per jam admin.** Gaji bulanan staf admin dibagi 173.
>
> Jika Anda mau, kirimkan tiga angka itu kepada kami lewat WhatsApp. Kami akan menghitung ulang bersama Anda, gratis, kurang dari 15 menit, sehingga Anda memegang angka yang bisa dipertanggungjawabkan ke pimpinan.
>
> **[Kirim angka Anda via WhatsApp]** (tautan wa.me dengan pesan terisi)
>
> Hormat kami,
> Farah, Winaya

### Email 2 · Hari 5 · Sewa atau beli
Tujuan: bukti biaya. CTA: lihat perbandingan di situs.

- Subjek A: `Rp23 juta per tahun untuk sewa, atau sekali bayar?`
- Subjek B: `Biaya absensi berlangganan tidak pernah berhenti`
- Preheader: `Ilustrasi untuk tim 100 orang, harga publik per Agustus 2026.`

> Yth. Bapak/Ibu,
>
> Kerugian dari absensi yang bocor hanya separuh cerita. Separuh lainnya adalah biaya alat yang Anda pakai untuk mencatatnya.
>
> Sebagai ilustrasi untuk tim 100 orang: aplikasi absensi berlangganan pada tier tertinggi Kerjoo (Rp19.175 per karyawan per bulan, harga publik Agustus 2026) menjadi sekitar **Rp23,01 juta setiap tahun, tanpa henti**. Winaya dibeli sekali: sekitar Rp48,68 juta di tahun pertama, lalu hanya **Rp3,68 juta per tahun** untuk hosting server. Seperti sewa dan beli rumah: selisihnya terus bertambah setiap tahun.
>
> Perbandingan lengkap dengan Talenta, Kerjoo, Gadjian/Hadirr, dan pembangunan sendiri tersedia di halaman kami, dengan sumber yang bisa Anda periksa.
>
> **[Lihat perbandingan biaya]** (`https://winaya.id/#perbandingan-biaya`)
>
> Hormat kami,
> Farah, Winaya

### Email 3 · Hari 9 · Absensi yang tidak bisa dipalsukan
Tujuan: menjawab "apakah datanya bisa dipercaya" untuk tim lapangan. Satu pesan: bukti kehadiran.

- Subjek A: `Karyawan di lokasi tanpa sinyal: bagaimana absensinya tetap sah?`
- Subjek B: `Tiga cara absensi lapangan dipalsukan, dan cara menutupnya`

> Yth. Bapak/Ibu,
>
> Perusahaan dengan {{jumlah_karyawan}} karyawan di banyak lokasi biasanya menghadapi tiga masalah yang sama:
>
> - **Lokasi tanpa sinyal.** Clock-in tersimpan aman di perangkat dan tersinkron otomatis begitu sinyal kembali. Fitur ini standar di semua paket, bukan tambahan.
> - **Titip absen.** Kode verifikasi sekali pakai yang kedaluwarsa dalam 90 detik memastikan yang absen benar orangnya.
> - **GPS palsu dan data yang diedit.** Delapan pengecekan otomatis di sisi server, dan log persetujuan yang tidak bisa diedit diam-diam, bahkan oleh admin.
>
> Kami dapat menyiapkan demo dengan data perusahaan Anda sendiri, bukan tampilan contoh, dalam empat minggu.
>
> **[Minta demo via WhatsApp]**
>
> Hormat kami,
> Farah, Winaya

### Email 4 · Hari 13 · Keberatan yang paling sering kami dengar
Tujuan: menghapus hambatan sebelum ajakan pembelian. Jujur, termasuk yang tidak termasuk.

- Subjek A: `Sebelum memutuskan: yang termasuk dan yang tidak termasuk di Winaya`
- Subjek B: `Apakah Winaya sudah termasuk payroll? Jawaban jujurnya`

> Yth. Bapak/Ibu,
>
> Beberapa pertanyaan yang biasanya muncul sebelum sebuah perusahaan memutuskan, beserta jawaban apa adanya:
>
> **Apakah sudah termasuk payroll, pajak, dan BPJS?** Belum. Winaya berhenti di rekap Excel yang terformat dan siap diproses aplikasi payroll yang Anda pakai. Ini keputusan cakupan yang disengaja supaya harga tetap masuk akal.
>
> **Apakah ada biaya bulanan?** Tidak ada biaya langganan. Satu-satunya biaya rutin yang pasti adalah hosting server, sekitar Rp1,2 sampai 3,7 juta per tahun.
>
> **Siapa yang memegang source code?** Anda. Source code dan dokumentasi diserahkan dengan lisensi perpetual di semua paket; satu-satunya batasan adalah tidak boleh dijual ulang.
>
> **Bagaimana kalau ada bug di tahun kedua?** Karena kodenya milik Anda, perbaikan bisa dikerjakan tim IT Anda, developer mana pun, atau kami secara terpisah dengan biaya yang disepakati sesuai lingkup.
>
> **Bisakah kami mencoba dulu sebelum membeli penuh?** Bisa. Kami membuka Uji Coba Satu Lokasi selama 30 hari: sistem yang sama, dipasang di satu lokasi atau tim Anda dengan hingga 100 karyawan. Biaya token hanya Rp500.000 untuk 30 hari, atau gratis bila Anda bersedia menjadi testimoni.
>
> Ada pertanyaan lain? Balas email ini atau tanyakan langsung lewat WhatsApp.
>
> **[Tanya via WhatsApp]**
>
> Hormat kami,
> Farah, Winaya

### Email 5 · Hari 18 · Rekomendasi paket dan langkah berikutnya
Tujuan: ajakan pembelian yang konkret. Ini email penjualan utama.

- Subjek A: `Rekomendasi untuk {{jumlah_karyawan}} karyawan: paket {{paket}}`
- Subjek B: `Dari hitungan Anda ke absensi yang berjalan dalam empat minggu`

> Yth. Bapak/Ibu,
>
> Berdasarkan hitungan Anda, untuk sekitar {{jumlah_karyawan}} karyawan dengan metode {{metode}}, titik awal yang wajar adalah paket **{{paket}}** ({{harga_paket}}, sekali bayar).
>
> `[TAMPILKAN HANYA BILA bulan_balik_modal < 12]` Dengan estimasi potensi kerugian {{estimasi_bawah}} sampai {{estimasi_atas}} per tahun, biaya paket ini berpotensi tertutup dalam sekitar {{bulan_balik_modal}} bulan.
>
> Cara kerjanya sederhana:
>
> 1. **Konsultasi 30 menit** untuk mencocokkan paket dengan kondisi lapangan Anda.
> 2. **Empat minggu ke demo pertama** yang sudah dikonfigurasi dengan daftar karyawan dan lokasi Anda.
> 3. **Kesepakatan tertulis** sebelum pekerjaan dimulai, termasuk penyerahan source code.
>
> Belum yakin untuk berkomitmen penuh? Kami juga membuka **Uji Coba Satu Lokasi, 30 Hari**: sistem yang sama, dipasang di satu lokasi atau tim Anda dengan hingga 100 karyawan. Biaya token hanya Rp500.000 untuk 30 hari, atau gratis bila Anda bersedia menjadi testimoni.
>
> `[TAMPILKAN HANYA BILA slot Founding masih tersedia]` Untuk tiga perusahaan pertama tersedia harga peluncuran Essential Rp19 juta (normal Rp29 juta). Ini bukan diskon musiman; program berakhir permanen begitu slotnya terisi. Slot tersisa: {{slot_tersisa}} dari 3.
>
> **[Jadwalkan konsultasi 30 menit via WhatsApp]**
>
> Hormat kami,
> Farah, Winaya

### Email 6 · Hari 25 · Penutup
Tujuan: menutup dengan hormat dan memancing balasan dari lead yang diam.

- Subjek A: `Haruskah kami berhenti menghubungi Anda?`
- Subjek B: `Terakhir dari kami, sampai Anda siap`

> Yth. Bapak/Ibu,
>
> Ini email terakhir dari rangkaian ini. Kami tidak ingin memenuhi kotak masuk Anda bila waktunya belum tepat.
>
> Bila ada satu hal yang menahan Anda (harga, waktu, persetujuan pimpinan, atau ragu terhadap angkanya), cukup balas satu kata: **harga**, **waktu**, **pimpinan**, atau **angka**. Kami akan mengirim penjelasan yang paling relevan.
>
> Bila tidak, Anda tetap bisa menghitung ulang kapan saja di winaya.id/#kalkulator-kerugian.
>
> Hormat kami,
> Farah, Winaya

## 6. Jangan biarkan lead terbuang: langkah di luar email

Email otomatis hanya pendukung. Yang menutup penjualan adalah sapaan manusia yang cepat.

1. **Aturan 1 jam.** Begitu notifikasi "Lead baru dari kalkulator" masuk ke `info@winaya.id`, kirim pesan WhatsApp personal (bila nomor sudah ada) atau balas email itu dalam **1 jam kerja**. Di luar jam kerja: balas pertama paling lambat pukul 09.00 esok hari.
2. **Naskah WhatsApp pertama** (ubah sesuai konteks):
   > Selamat pagi Bapak/Ibu, saya Farah dari Winaya. Hasil hitungan kalkulator Anda menunjukkan potensi kerugian absensi {{estimasi_bawah}} sampai {{estimasi_atas}} per tahun untuk {{jumlah_karyawan}} karyawan. Boleh saya bantu memeriksa ketiga asumsinya bersama Anda? Sekitar 15 menit, gratis.
3. **Catat setiap lead** di satu tabel (email, waktu masuk, waktu sapaan pertama, status: baru, disapa, konsultasi, penawaran, menang, kalah, alasan kalah). Tanpa ini tidak ada yang bisa dievaluasi.
4. **Sinyal minat tinggi** (percepat ke Email 5 atau telepon langsung): menghitung lebih dari sekali, membalas email, menekan tombol WhatsApp, membuka tautan harga.
5. **Lead kecil tetap dirawat.** Tim di bawah 30 orang dengan estimasi kecil cocok untuk paket Essential; jangan diabaikan hanya karena nilai awalnya kecil.
6. **Tawarkan uji coba untuk lead yang ragu.** Bila lead tertarik tapi belum berani berkomitmen beli putus, tawarkan **Uji Coba Satu Lokasi, 30 Hari** untuk tim hingga 100 karyawan (token hanya Rp500.000 untuk 30 hari, atau gratis dengan syarat testimoni) sebelum menyerah pada leadnya. Tidak butuh persiapan tambahan karena yang dipasang adalah Winaya sendiri, jadi risikonya rendah bagi kedua pihak.

## 7. Cara menjalankan rangkaian ini

Saat ini sistem baru mengirim **Email 0** dan menyimpan data. Ada tiga pilihan untuk Email 1 sampai 6:

| Pilihan | Cara | Cocok bila |
|---|---|---|
| **A. Manual berkala** | Ambil daftar opt-in (`node export.js`), kirim lewat alat email biasa sesuai jadwal | Lead masih puluhan |
| **B. Otomatis di layanan yang sama** | Tambahkan penjadwal di `winaya-mailer` yang mengirim email hari 2, 5, 9, 13, 18, 25 ke lead opt-in dan menghentikan rangkaian bila ada balasan | Lead ratusan; pekerjaan sekitar 1 sampai 2 hari |
| **C. Alat pemasaran email** (Brevo, dll.) | Impor CSV opt-in, pakai fitur otomatisasi bawaan | Ingin pelacakan buka/klik tanpa membangun sendiri |

Rekomendasi: mulai dengan **A** untuk 20 lead pertama sambil menyempurnakan naskah, lalu pindah ke **B**
atau **C** setelah alurnya terbukti.

## 8. Ukuran keberhasilan

Pantau per email: terkirim, dibuka, diklik, dibalas, dan **percakapan WhatsApp yang dimulai**.
Ukuran akhir yang penting bukan buka atau klik, melainkan: lead → konsultasi → penawaran → pembelian.
Pembanding awal dari riset di atas (bukan target pasti): buka 28 sampai 42%, klik 3 sampai 7%, balasan 2 sampai 4%.
Nilai email ini rendah bila balasan pertama manusia lambat; perbaiki kecepatan sapaan sebelum mengubah naskah.
