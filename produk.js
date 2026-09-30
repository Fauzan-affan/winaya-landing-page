/* ============================================================
   produk.html — script ringan khusus halaman ini (BUKAN script.js
   homepage, yang penuh dependensi elemen homepage seperti hero
   video/chart/kalkulator yang tidak ada di halaman ini).
   ============================================================ */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navbar: solid saat scroll (halaman ini selalu di atas
     latar krem, jadi kelas on-light sudah statis di HTML). ---------- */
  var navbar = document.getElementById('navbar');
  function onScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Smooth scroll offset untuk navbar fixed (TOC & anchor) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var offset = navbar.offsetHeight + 8;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Google Analytics: klik WhatsApp sebagai konversi ---------- */
  document.querySelectorAll('a[data-wa]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', 'klik_whatsapp', {
        lokasi_cta: link.getAttribute('data-wa'),
        link_text: (link.textContent || '').trim().slice(0, 60)
      });
    });
  });

  /* ---------- Lightbox: klik gambar untuk memperbesar ---------- */
  var lightbox = document.getElementById('produk-lightbox');
  var lightboxImg = lightbox.querySelector('img');
  document.querySelectorAll('.produk-figure img').forEach(function (img) {
    img.addEventListener('click', function () {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('open');
    });
  });
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightboxImg.src = '';
  }
  lightbox.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
})();
