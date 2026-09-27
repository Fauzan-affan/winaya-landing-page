'use strict';

const PDFDocument = require('pdfkit');
const { rupiah, decimal, recommendation } = require('./calc');

const INK = '#23301E';
const SOFT = '#5B6656';
const FOREST = '#4C8A3C';
const RULE = '#D9D6C8';

/* Membuat PDF A4 "Rincian Perhitungan & Rekomendasi" sebagai Buffer. */
function buildPdf(v, r) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56, info: { Title: 'Rincian Perhitungan & Rekomendasi Winaya', Author: 'Winaya' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - left - doc.page.margins.right;
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

    function heading(text) {
      doc.moveDown(0.9).font('Helvetica-Bold').fontSize(9).fillColor(INK).text(text.toUpperCase(), left, doc.y, { characterSpacing: 1 });
      doc.moveDown(0.35);
    }
    function row(label, value, big) {
      const y = doc.y;
      doc.font('Helvetica').fontSize(10).fillColor(SOFT).text(label, left, y, { width: width * 0.58 });
      const h1 = doc.y - y;
      doc.font('Helvetica-Bold').fontSize(big ? 11 : 10).fillColor(INK).text(value, left + width * 0.6, y, { width: width * 0.4, align: 'right' });
      doc.y = y + Math.max(h1, doc.heightOfString(value, { width: width * 0.4 })) + 6;
    }
    function rule() {
      doc.moveDown(0.3);
      doc.moveTo(left, doc.y).lineTo(left + width, doc.y).lineWidth(0.6).strokeColor(RULE).stroke();
      doc.moveDown(0.2);
    }

    doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text('Winaya', left, 56);
    doc.fillColor(FOREST).text('.', left + doc.widthOfString('Winaya'), 56);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(FOREST).text('RINCIAN PERHITUNGAN & REKOMENDASI', left, 92, { characterSpacing: 1.2 });
    doc.font('Helvetica-Bold').fontSize(18).fillColor(INK).text('Estimasi Potensi Kerugian Absensi', left, 108);
    doc.font('Helvetica').fontSize(9).fillColor(SOFT).text('Dibuat ' + date + (v.name || v.company ? ' oleh tim Winaya dengan kalkulator winaya.id' : ' melalui kalkulator winaya.id'), left, doc.y + 2);

    if (v.name || v.company) {
      heading('Disiapkan untuk');
      if (v.name) row('Nama', v.name);
      if (v.company) row('Perusahaan', v.company);
      rule();
    }

    heading('Data yang Anda masukkan');
    row('Jumlah karyawan lapangan', v.headcount + ' orang');
    row('Metode absensi saat ini', r.methodText);
    row('Rata-rata gaji per bulan', r.salaryText);
    rule();

    heading('Asumsi yang digunakan');
    row('Kebocoran dari total payroll', decimal(v.leakPct, '%'));
    row('Jam admin rekap manual per bulan (semua karyawan)', decimal(v.hoursPerMonth, ' jam'));
    row('Biaya waktu admin per jam', rupiah(v.ratePerHour) + '/jam');
    rule();

    heading('Rincian perhitungan per tahun');
    row('Total payroll tahunan', rupiah(r.totalPayrollTahunan));
    row('Kerugian kebocoran titip absen', rupiah(r.kerugianKebocoran));
    row('Biaya admin rekap manual', rupiah(r.biayaAdmin));
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10.5).fillColor(INK).text('Estimasi potensi kerugian per tahun', left, doc.y);
    doc.font('Helvetica-Bold').fontSize(17).fillColor(FOREST).text(rupiah(r.low) + ' – ' + rupiah(r.high), left, doc.y + 2);
    rule();

    heading('Rekomendasi');
    doc.font('Helvetica').fontSize(10.5).fillColor(SOFT).text(recommendation(v.headcount, r.estimasi), left, doc.y, { width, lineGap: 3 });

    doc.moveDown(1.2);
    doc.font('Helvetica').fontSize(8).fillColor(SOFT).text(
      '*Asumsi awal kebocoran payroll akibat "buddy punching"/titip absen sebesar 1% adalah angka konservatif internal Winaya. Sebagai pembanding, riset Nucleus Research menyebut rata-rata 2,2% dari total payroll kotor pada metode fingerprint satu lokasi. Asumsi jam admin rekap manual juga merupakan estimasi konservatif internal Winaya. Ini bukan angka pasti, melainkan estimasi untuk bahan diskusi awal dengan tim Winaya; kami tidak mengklaim angka ini presisi untuk setiap bisnis.',
      left, doc.y, { width, lineGap: 2 });

    doc.end();
  });
}

module.exports = { buildPdf };
