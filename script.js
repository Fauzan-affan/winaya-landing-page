/* ============================================================
   Winaya Landing Page — script.js (vanilla JS, no framework)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Navbar: solid saat scroll ---------- */
  var navbar = document.getElementById('navbar');
  function onScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Angka animasi hitung naik saat scroll masuk viewport ---------- */
  var countEls = document.querySelectorAll('.count-num');
  if (countEls.length) {
    var countReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var formatCount = function (n) { return Math.round(n).toLocaleString('id-ID'); };
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      if (countReduceMotion) {
        el.textContent = formatCount(target);
        return;
      }
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatCount(eased * target);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      countEls.forEach(function (el) { countObserver.observe(el); });
    } else {
      countEls.forEach(runCount);
    }
  }

  /* ---------- Floating back-to-top ---------- */
  var backToTop = document.getElementById('back-to-top');
  function onScrollTopButton() {
    if (window.scrollY > 600) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }
  window.addEventListener('scroll', onScrollTopButton, { passive: true });
  onScrollTopButton();
  backToTop.addEventListener('click', function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Hero video cross-fade ---------- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;
  var videos = [
    document.getElementById('hero-video-1'),
    document.getElementById('hero-video-2'),
    document.getElementById('hero-video-3')
  ];

  if (!prefersReducedMotion) {
    if (isMobile) {
      // Mobile: hanya scene 1 yang diputar, hemat bandwidth.
      videos[1].remove();
      videos[2].remove();
      videos = [videos[0]];
      videos[0].play().catch(function () {});
    } else {
      var current = 0;
      var SCENE_DURATION = 6000; // ms per scene sebelum cross-fade
      videos[0].play().catch(function () {});

      setInterval(function () {
        var next = (current + 1) % videos.length;
        var nextVideo = videos[next];
        nextVideo.currentTime = 0;
        nextVideo.play().catch(function () {});
        nextVideo.classList.add('is-active');
        videos[current].classList.remove('is-active');
        // Pause video lama setelah transisi selesai (800ms di CSS)
        var prev = current;
        setTimeout(function () { videos[prev].pause(); }, 900);
        current = next;
      }, SCENE_DURATION);
    }
  } else {
    // Reduced motion: CSS sudah menyembunyikan video & menampilkan poster.
    videos.forEach(function (v) { v.pause(); });
  }

  /* ---------- FAQ accordion ---------- */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // Tutup semua item lain
      faqItems.forEach(function (other) {
        other.classList.remove('open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-answer').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Chart perbandingan biaya (Chart.js CDN) ---------- */
  function initChart() {
    if (typeof Chart === 'undefined') {
      // Chart.js belum termuat (defer) — coba lagi sebentar.
      setTimeout(initChart, 200);
      return;
    }
    var canvas = document.getElementById('costChart');
    if (!canvas) return;

    var chartFont = "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    var inkSoft = 'rgba(234, 240, 236, 0.68)';
    var inkFaint = 'rgba(234, 240, 236, 0.45)';
    var ctx = canvas.getContext('2d');

    var winayaGradient = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 320);
    winayaGradient.addColorStop(0, '#8FD673');
    winayaGradient.addColorStop(1, '#5C9C49');

    var subscriptionData = [23.01, 23.01, 23.01];
    var winayaData = [48.68, 3.68, 3.68];
    var chartInstance = null;
    var scrollTicking = false;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function scrollProgress() {
      var rect = canvas.getBoundingClientRect();
      var vh = window.innerHeight;
      var start = vh * 0.92;
      var end = vh * 0.35;
      var raw = (start - rect.top) / (start - end);
      return Math.max(0, Math.min(1, raw));
    }

    function applyScrollProgress() {
      scrollTicking = false;
      if (!chartInstance) return;
      var eased = easeOutCubic(scrollProgress());
      chartInstance.data.datasets[0].data = subscriptionData.map(function (v) { return v * eased; });
      chartInstance.data.datasets[1].data = winayaData.map(function (v) { return v * eased; });
      chartInstance.update('none');
    }

    function onScrollOrResize() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(applyScrollProgress);
    }

    function buildChart() {
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Tahun 1', 'Tahun 2', 'Tahun 3'],
          datasets: [
            {
              label: 'Subscription (sewa selamanya)',
              data: [0, 0, 0],
              backgroundColor: 'rgba(234, 240, 236, 0.18)',
              hoverBackgroundColor: 'rgba(234, 240, 236, 0.28)',
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 56
            },
            {
              label: 'Winaya (beli sekali)',
              data: [0, 0, 0],
              backgroundColor: winayaGradient,
              hoverBackgroundColor: '#8FD673',
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 56
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1.35,
          animation: false,
          interaction: { mode: 'index', intersect: false },
          categoryPercentage: 0.62,
          barPercentage: 0.9,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: chartFont, size: 12.5 },
                color: inkSoft,
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 8,
                boxHeight: 8,
                padding: 20
              }
            },
            tooltip: {
              backgroundColor: '#181F22',
              borderColor: 'rgba(111, 178, 90, 0.35)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              titleFont: { family: chartFont, size: 12.5, weight: '600' },
              bodyFont: { family: chartFont, size: 12.5 },
              titleColor: '#F5F8F6',
              bodyColor: inkSoft,
              usePointStyle: true,
              boxPadding: 4,
              callbacks: {
                label: function (chartCtx) {
                  return chartCtx.dataset.label + ': Rp ' + chartCtx.parsed.y.toLocaleString('id-ID') + ' jt';
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 55,
              title: {
                display: true,
                text: 'Biaya per tahun (Rp juta), tim 100 orang',
                font: { family: chartFont, size: 11.5 },
                color: inkFaint
              },
              ticks: {
                color: inkFaint,
                font: { family: chartFont, size: 11.5 },
                padding: 8,
                callback: function (value) { return 'Rp ' + value + ' jt'; }
              },
              grid: { color: 'rgba(255, 255, 255, 0.07)', drawTicks: false, borderDash: [3, 4] },
              border: { display: false }
            },
            x: {
              ticks: { color: inkSoft, font: { family: chartFont, size: 12.5, weight: '600' }, padding: 10 },
              grid: { display: false },
              border: { color: 'rgba(255, 255, 255, 0.12)' }
            }
          }
        }
      });
    }

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    buildChart();

    if (reduceMotion) {
      chartInstance.data.datasets[0].data = subscriptionData.slice();
      chartInstance.data.datasets[1].data = winayaData.slice();
      chartInstance.update('none');
      return;
    }

    applyScrollProgress();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
  }
  initChart();

  /* ---------- Smooth scroll offset untuk navbar fixed ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var offset = navbar.offsetHeight + 8;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });
})();
