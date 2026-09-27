'use strict';

/* Formula dan batas nilai HARUS sama dengan kalkulator di landing page
   (script.js, fungsi initCalculator). Server menghitung ulang dari input
   mentah, tidak pernah memercayai angka hasil dari browser. */

const METHODS = {
  kertas: 'Kertas / tanda tangan manual',
  fingerprint: 'Fingerprint di satu lokasi (kantor/site utama)',
  whatsapp: 'Laporan WhatsApp / foto manual',
  'app-lain': 'Aplikasi absensi lain (berlangganan bulanan/tahunan)'
};

const SALARIES = {
  3000000: '< Rp 3.500.000',
  4250000: 'Rp 3.500.000 – Rp 5.000.000',
  6500000: 'Rp 5.000.000 – Rp 8.000.000',
  8500000: '> Rp 8.000.000'
};

const TIERS = [
  { max: 50, name: 'Essential', price: 29000000 },
  { max: 150, name: 'Complete', price: 45000000 },
  { max: Infinity, name: 'Enterprise', price: 75000000 }
];

function rupiah(n) {
  return 'Rp' + Math.round(Math.max(0, n)).toLocaleString('id-ID');
}
function decimal(n, suffix) {
  return n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + suffix;
}

/* Teks bebas: buang karakter kontrol, rapikan spasi, batasi panjang. */
function clean(v, max) {
  return String(v || '').replace(/[\x00-\x1f\x7f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/* Mengembalikan { ok: true, value } atau { ok: false, error } */
function validate(body) {
  const b = body || {};
  const email = String(b.email || '').trim();
  if (email.length < 5 || email.length > 120 || !/^[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]{2,}$/.test(email)) {
    return { ok: false, error: 'Alamat email tidak valid.' };
  }
  if (b.consent !== true) {
    return { ok: false, error: 'Persetujuan pengiriman email diperlukan.' };
  }
  const headcount = Number(b.headcount);
  if (!Number.isInteger(headcount) || headcount < 1 || headcount > 100000) {
    return { ok: false, error: 'Jumlah karyawan tidak valid.' };
  }
  const method = String(b.method || '');
  if (!Object.prototype.hasOwnProperty.call(METHODS, method)) {
    return { ok: false, error: 'Metode absensi tidak valid.' };
  }
  const salary = Number(b.salary);
  if (!Object.prototype.hasOwnProperty.call(SALARIES, String(salary))) {
    return { ok: false, error: 'Rentang gaji tidak valid.' };
  }
  const leakPct = Number(b.leakPct);
  const hoursPerMonth = Number(b.hoursPerMonth);
  const ratePerHour = Number(b.ratePerHour);
  if (!(leakPct >= 0 && leakPct <= 6) || !(hoursPerMonth >= 1 && hoursPerMonth <= 40) || !(ratePerHour >= 500 && ratePerHour <= 500000)) {
    return { ok: false, error: 'Nilai asumsi di luar batas.' };
  }
  return { ok: true, value: { email: email.toLowerCase(), marketing: b.marketing === true, headcount, method, salary, leakPct, hoursPerMonth, ratePerHour } };
}

function compute(v) {
  const totalPayrollTahunan = v.headcount * v.salary * 12;
  const kerugianKebocoran = totalPayrollTahunan * (v.leakPct / 100);
  const jamAdminTahunan = v.hoursPerMonth * 12;
  const biayaAdmin = jamAdminTahunan * v.ratePerHour;
  const estimasi = kerugianKebocoran + biayaAdmin;
  return {
    totalPayrollTahunan, kerugianKebocoran, biayaAdmin, estimasi,
    low: estimasi * 0.8, high: estimasi * 1.2,
    methodText: METHODS[v.method], salaryText: SALARIES[String(v.salary)]
  };
}

function recommendation(headcount, estimasi) {
  const tier = TIERS.find((t) => headcount <= t.max);
  let text = 'Sebagai titik awal berdasarkan sekitar ' + headcount + ' karyawan lapangan, tier ' + tier.name +
    ' (' + rupiah(tier.price) + ', sekali bayar) dapat menjadi pilihan yang sesuai.';
  if (estimasi > 0) {
    const months = tier.price / (estimasi / 12);
    if (months > 0 && months < 24) {
      text += ' Dengan estimasi potensi kerugian sekitar ' + rupiah(estimasi) +
        ' per tahun, biaya tier ini berpotensi tertutup dalam sekitar ' + Math.max(1, Math.round(months)) +
        ' bulan pertama, dan tidak ada biaya langganan setelahnya.';
    }
  }
  text += ' Rincian tiap tier ada di bagian Harga pada halaman winaya.id; keputusan akhir sebaiknya didiskusikan langsung dengan tim kami.';
  return text;
}

function tierFor(headcount) { return TIERS.find((t) => headcount <= t.max); }

module.exports = { METHODS, SALARIES, validate, compute, recommendation, tierFor, rupiah, decimal };
