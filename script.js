/* ============================================================
   Winaya Landing Page — script.js (vanilla JS, no framework)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Navbar: solid saat scroll ---------- */
  var navbar = document.getElementById('navbar');

  /* Scrim di belakang navbar ikut warna section yang sedang dilewati: gelap di
     hero dan footer, krem di seluruh section terang di tengah halaman. */
  var lightSections = document.querySelectorAll('.stats-bar, .section-light, .section-cream, .section-navy');

  /* Diukur tiap scroll (bukan sekali di awal) karena tinggi halaman masih
     berubah setelah chart dan video hero selesai dirender. */
  function navOverLightSection() {
    for (var i = 0; i < lightSections.length; i++) {
      var rect = lightSections[i].getBoundingClientRect();
      // Stats bar masih punya ramp gelap 230px di atasnya, jadi baru dihitung
      // terang setelah ramp itu lewat. 150 memberi jeda saat masuk peralihan.
      var darkLead = lightSections[i].classList.contains('stats-bar') ? 230 : 0;
      if (rect.top + darkLead <= 150 && rect.bottom >= 90) return true;
    }
    return false;
  }

  function onScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    if (navOverLightSection()) {
      navbar.classList.add('on-light');
    } else {
      navbar.classList.remove('on-light');
    }
  }
  var navTicking = false;
  function onScrollThrottled() {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(function () { navTicking = false; onScroll(); });
  }
  window.addEventListener('scroll', onScrollThrottled, { passive: true });
  window.addEventListener('resize', onScrollThrottled);
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
    var inkSoft = 'rgba(35, 48, 30, 0.72)';
    var inkFaint = 'rgba(35, 48, 30, 0.5)';
    var ctx = canvas.getContext('2d');

    var winayaGradient = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 320);
    winayaGradient.addColorStop(0, '#7FC963');
    winayaGradient.addColorStop(1, '#4C863C');

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
              backgroundColor: 'rgba(35, 48, 30, 0.16)',
              hoverBackgroundColor: 'rgba(35, 48, 30, 0.26)',
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 56
            },
            {
              label: 'Winaya (beli sekali)',
              data: [0, 0, 0],
              backgroundColor: winayaGradient,
              hoverBackgroundColor: '#5C9C49',
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
              backgroundColor: '#23301E',
              borderColor: 'rgba(111, 178, 90, 0.45)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              titleFont: { family: chartFont, size: 12.5, weight: '600' },
              bodyFont: { family: chartFont, size: 12.5 },
              titleColor: '#F5F8F6',
              bodyColor: 'rgba(245, 248, 246, 0.78)',
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
              grid: { color: 'rgba(35, 48, 30, 0.1)', drawTicks: false, borderDash: [3, 4] },
              border: { display: false }
            },
            x: {
              ticks: { color: inkSoft, font: { family: chartFont, size: 12.5, weight: '600' }, padding: 10 },
              grid: { display: false },
              border: { color: 'rgba(35, 48, 30, 0.18)' }
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

  /* ---------- Kalkulator potensi kerugian absensi ----------
     Semua kalkulasi jalan di client-side, live setiap input/slider berubah,
     tanpa tombol "Hitung". Formula:
       Total Payroll Tahunan    = Jumlah Karyawan x Gaji Bulanan x 12
       Kerugian Kebocoran/Tahun = Total Payroll Tahunan x %Kebocoran
       Jam Admin/Tahun          = (Jumlah Karyawan / 10) x Jam Admin per Bulan x 12
       Biaya Admin/Tahun        = Jam Admin/Tahun x Biaya per Jam Admin
       Estimasi Kerugian/Tahun  = Kerugian Kebocoran/Tahun + Biaya Admin/Tahun
     Hasil selalu ditampilkan sebagai rentang (estimasi x 0.8 sampai x 1.2),
     bukan angka tunggal, supaya tidak terkesan presisi palsu. */
  function initCalculator() {
    var headcountEl = document.getElementById('calcHeadcount');
    var methodEl = document.getElementById('calcMethod');
    var salaryEl = document.getElementById('calcSalary');
    var leakSlider = document.getElementById('calcLeakSlider');
    var hoursSlider = document.getElementById('calcHoursSlider');
    var rateSlider = document.getElementById('calcRateSlider');
    var leakValueEl = document.getElementById('calcLeakValue');
    var hoursValueEl = document.getElementById('calcHoursValue');
    var rateValueEl = document.getElementById('calcRateValue');
    var rangeOutputEl = document.getElementById('calcRangeOutput');
    var leakAmountEl = document.getElementById('calcLeakAmount');
    var adminAmountEl = document.getElementById('calcAdminAmount');

    /* Modal berisi formulir kontak; tombol di kartu kalkulator hanya membukanya. */
    var modal = document.getElementById('calcModal');
    var openModalBtn = document.getElementById('calcOpenModalBtn');
    var lastFocusedEl = null;
    var currentInputs = null; // input mentah terakhir, dikirim ke server untuk dihitung ulang

    if (!headcountEl || !methodEl || !salaryEl || !modal) return;

    var calcChart = null;

    function formatRupiah(n) {
      return 'Rp' + Math.round(Math.max(0, n)).toLocaleString('id-ID');
    }
    function formatDecimal(n, suffix) {
      return n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + suffix;
    }

    /* Slider asumsi otomatis reset ke default metode yang dipilih, tapi tetap
       bisa digeser manual setelahnya. */
    /* Jam admin dihitung TOTAL per bulan untuk seluruh karyawan (bukan per 10
       karyawan). Rentang tetap 1 sampai 40 jam (5 hari kerja), nilai awal 8
       jam (1 hari kerja) untuk semua metode dan jumlah karyawan. */
    var DEFAULT_ADMIN_HOURS = 8;
    function applyMethodDefaults() {
      var opt = methodEl.options[methodEl.selectedIndex];
      leakSlider.value = opt.getAttribute('data-leak');
      hoursSlider.value = String(DEFAULT_ADMIN_HOURS);
    }

    function updateSliderLabels() {
      leakValueEl.textContent = formatDecimal(parseFloat(leakSlider.value), '%');
      hoursValueEl.textContent = formatDecimal(parseFloat(hoursSlider.value), ' jam');
      rateValueEl.textContent = formatRupiah(parseFloat(rateSlider.value));
    }

    function updateChart(leak, admin) {
      if (typeof Chart === 'undefined') {
        setTimeout(function () { updateChart(leak, admin); }, 200);
        return;
      }
      var canvas = document.getElementById('calcChart');
      if (!canvas) return;
      var chartFont = "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      if (!calcChart) {
        /* Bar vertikal (bukan horizontal): kolom panel hasil sempit, dan label
           kategori panjang ("Kebocoran titip absen") kepotong kalau dipasang
           di sumbu-Y horizontal. Label singkat di sini, rincian lengkapnya
           sudah ada di baris breakdown teks di atas chart. */
        calcChart = new Chart(canvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Kebocoran', 'Admin'],
            datasets: [{
              data: [leak, admin],
              backgroundColor: ['rgba(35, 48, 30, 0.18)', '#4C8A3C'],
              hoverBackgroundColor: ['rgba(35, 48, 30, 0.28)', '#5C9C49'],
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 64
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.1,
            animation: false,
            categoryPercentage: 0.5,
            barPercentage: 0.9,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#23301E',
                borderColor: 'rgba(111, 178, 90, 0.45)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                bodyFont: { family: chartFont, size: 12 },
                callbacks: {
                  label: function (ctx) { return formatRupiah(ctx.parsed.y) + '/tahun'; }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: 'rgba(35, 48, 30, 0.5)',
                  font: { family: chartFont, size: 10.5 },
                  callback: function (v) { return 'Rp' + (v / 1000000).toFixed(0) + 'jt'; }
                },
                grid: { color: 'rgba(35, 48, 30, 0.1)', drawTicks: false, borderDash: [3, 4] },
                border: { display: false }
              },
              x: {
                ticks: { color: 'rgba(35, 48, 30, 0.72)', font: { family: chartFont, size: 11.5, weight: '600' } },
                grid: { display: false },
                border: { color: 'rgba(35, 48, 30, 0.18)' }
              }
            }
          }
        });
      } else {
        calcChart.data.datasets[0].data = [leak, admin];
        calcChart.update('none');
      }
    }

    function calculate() {
      var headcount = Math.max(1, parseInt(headcountEl.value, 10) || 1);
      var salary = parseFloat(salaryEl.value) || 0;
      var leakPctValue = parseFloat(leakSlider.value);
      var leakPct = leakPctValue / 100;
      var hoursPerMonth = parseFloat(hoursSlider.value);
      var ratePerHour = parseFloat(rateSlider.value);

      var totalPayrollTahunan = headcount * salary * 12;
      var kerugianKebocoran = totalPayrollTahunan * leakPct;
      var jamAdminTahunan = hoursPerMonth * 12;
      var biayaAdmin = jamAdminTahunan * ratePerHour;
      var estimasi = kerugianKebocoran + biayaAdmin;
      var low = estimasi * 0.8;
      var high = estimasi * 1.2;
      currentInputs = {
        headcount: headcount, method: methodEl.value, salary: salary,
        leakPct: leakPctValue, hoursPerMonth: hoursPerMonth, ratePerHour: ratePerHour
      };

      updateSliderLabels();
      rangeOutputEl.textContent = formatRupiah(low) + '–' + formatRupiah(high);
      leakAmountEl.textContent = Math.round(kerugianKebocoran).toLocaleString('id-ID');
      adminAmountEl.textContent = Math.round(biayaAdmin).toLocaleString('id-ID');
      updateChart(kerugianKebocoran, biayaAdmin);
    }

    methodEl.addEventListener('change', function () {
      applyMethodDefaults();
      calculate();
    });
    headcountEl.addEventListener('input', calculate);
    salaryEl.addEventListener('change', calculate);
    [leakSlider, hoursSlider, rateSlider].forEach(function (el) {
      el.addEventListener('input', calculate);
    });

    applyMethodDefaults();
    calculate();

    /* ---- Modal: buka/tutup ---- */
    if (openModalBtn) {
      function openModal() {
        lastFocusedEl = document.activeElement;
        modal.hidden = false;
        document.addEventListener('keydown', onModalKeydown);
        var firstField = document.getElementById('calcEmail');
        if (firstField) firstField.focus();
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'buka_modal_kalkulator');
        }
      }
      function closeModal() {
        modal.hidden = true;
        document.removeEventListener('keydown', onModalKeydown);
        if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
      }
      function onModalKeydown(e) {
        if (e.key === 'Escape') closeModal();
      }
      openModalBtn.addEventListener('click', openModal);
      modal.querySelectorAll('[data-modal-close]').forEach(function (el) {
        el.addEventListener('click', closeModal);
      });
    }

    /* ---- Formulir email: kirim PDF ke email ----
       Modal hanya meminta email (plus persetujuan). Browser mengirim email
       bersama input mentah kalkulator; server menghitung ulang, membuat PDF,
       mengirimnya, dan menyimpan email di database (marketing hanya bila
       kotak opsional dicentang). Hasil analisis sengaja tidak ditampilkan di
       halaman. Email tidak dikirim ke GA dan tidak disimpan di browser. */
    var emailForm = document.getElementById('calcEmailForm');
    if (emailForm) {
      var emailInput = document.getElementById('calcEmail');
      var consentInput = document.getElementById('calcEmailConsent');
      var marketingInput = document.getElementById('calcMarketingConsent');
      var honeypot = document.getElementById('calcWebsite');
      var emailSubmit = document.getElementById('calcEmailSubmit');
      var emailStatus = document.getElementById('calcEmailStatus');
      var formView = document.getElementById('calcFormView');
      var successView = document.getElementById('calcSuccess');

      // Setiap modal dibuka lagi, kembali ke tampilan formulir.
      if (openModalBtn) {
        openModalBtn.addEventListener('click', function () {
          successView.hidden = true;
          formView.hidden = false;
          emailSubmit.disabled = false;
          emailSubmit.textContent = 'Kirim PDF ke Email';
          setStatus('', '');
        });
      }

      function setStatus(kind, text) {
        emailStatus.className = 'calc-email-status' + (kind ? ' is-' + kind : '');
        emailStatus.textContent = text || '';
      }
      function fail(input, text) {
        emailInput.classList.remove('is-invalid');
        if (input === emailInput) emailInput.classList.add('is-invalid');
        if (input) input.focus();
        setStatus('error', text);
      }

      emailForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = emailInput.value.trim();
        if (!/^[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]{2,}$/.test(email)) {
          return fail(emailInput, 'Mohon isi alamat email yang valid.');
        }
        if (!consentInput.checked) return fail(consentInput, 'Mohon centang persetujuan pengiriman untuk melanjutkan.');
        if (!currentInputs) return;

        emailInput.classList.remove('is-invalid');
        emailSubmit.disabled = true;
        emailSubmit.textContent = 'Mengirim...';
        setStatus('', '');

        var payload = Object.assign({
          email: email, consent: true, marketing: marketingInput.checked,
          website: honeypot ? honeypot.value : ''
        }, currentInputs);
        fetch(emailForm.getAttribute('data-endpoint'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (resp) {
            return resp.json().catch(function () { return {}; }).then(function (data) { return { ok: resp.ok && data.ok, data: data }; });
          })
          .then(function (result) {
            if (result.ok) {
              if (typeof window.gtag === 'function') window.gtag('event', 'kirim_email_kalkulator', { marketing_optin: marketingInput.checked ? 'ya' : 'tidak' });
              // Modal berganti jadi ikon centang + konfirmasi + tombol tutup.
              emailInput.value = '';
              formView.hidden = true;
              successView.hidden = false;
              document.getElementById('calcSuccessClose').focus();
            } else {
              setStatus('error', (result.data && result.data.error) || 'Email belum berhasil dikirim. Silakan coba lagi sebentar lagi.');
              emailSubmit.disabled = false;
              emailSubmit.textContent = 'Kirim PDF ke Email';
            }
          })
          .catch(function () {
            setStatus('error', 'Tidak dapat terhubung ke server. Periksa koneksi Anda, lalu coba lagi.');
            emailSubmit.disabled = false;
            emailSubmit.textContent = 'Kirim PDF ke Email';
          });
      });
    }
  }
  initCalculator();

  /* ---------- Combobox kustom untuk dropdown kalkulator ----------
     Daftar pilihan <select> bawaan digambar oleh sistem operasi dan tidak bisa
     diberi gaya. Di sini <select> tetap ada (tersembunyi) sebagai sumber nilai,
     sehingga kode kalkulator yang membaca select.value / event "change" tidak
     berubah; tampilannya diganti tombol + daftar bergaya Winaya, lengkap dengan
     dukungan keyboard (panah, Home/End, Enter/Spasi, Escape) dan ARIA. */
  (function initCalcSelects() {
    var closers = [];
    function closeAll(except) { closers.forEach(function (fn) { fn(except); }); }
    var CHEVRON = '<svg class="calc-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
    var CHECK = '<svg class="calc-select-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

    document.querySelectorAll('.calc-field select').forEach(function (select) {
      var label = document.querySelector('label[for="' + select.id + '"]');
      var wrap = document.createElement('div');
      wrap.className = 'calc-select';
      select.parentNode.insertBefore(wrap, select);
      wrap.appendChild(select);
      select.classList.add('calc-select-native');
      select.tabIndex = -1;
      select.setAttribute('aria-hidden', 'true');

      var listId = select.id + 'List';
      var trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.id = select.id + 'Trigger';
      trigger.className = 'calc-select-trigger';
      trigger.setAttribute('role', 'combobox');
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', listId);
      if (label) {
        if (!label.id) label.id = select.id + 'Label';
        trigger.setAttribute('aria-labelledby', label.id + ' ' + trigger.id);
      }
      trigger.innerHTML = '<span class="calc-select-value"></span>' + CHEVRON;
      var valueEl = trigger.querySelector('.calc-select-value');

      var list = document.createElement('ul');
      list.id = listId;
      list.className = 'calc-select-list';
      list.setAttribute('role', 'listbox');
      if (label) list.setAttribute('aria-labelledby', label.id);
      list.hidden = true;

      var items = Array.prototype.map.call(select.options, function (opt, i) {
        var li = document.createElement('li');
        li.id = listId + '-' + i;
        li.setAttribute('role', 'option');
        var text = document.createElement('span');
        text.className = 'calc-select-text';
        text.textContent = opt.text;
        li.appendChild(text);
        li.insertAdjacentHTML('beforeend', CHECK);
        li.addEventListener('mouseenter', function () { setActive(i); });
        li.addEventListener('mousedown', function (e) { e.preventDefault(); });
        li.addEventListener('click', function () { choose(i); });
        list.appendChild(li);
        return li;
      });
      wrap.appendChild(trigger);
      wrap.appendChild(list);

      var active = -1;
      function refresh() {
        valueEl.textContent = select.options[select.selectedIndex].text;
        items.forEach(function (li, i) {
          var on = i === select.selectedIndex;
          li.classList.toggle('is-selected', on);
          li.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }
      function setActive(i) {
        active = Math.max(0, Math.min(items.length - 1, i));
        items.forEach(function (li, k) { li.classList.toggle('is-active', k === active); });
        trigger.setAttribute('aria-activedescendant', items[active].id);
        items[active].scrollIntoView({ block: 'nearest' });
      }
      function isOpen() { return !list.hidden; }
      function open() {
        closeAll(wrap);
        list.hidden = false;
        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        setActive(select.selectedIndex);
      }
      function close() {
        list.hidden = true;
        wrap.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-activedescendant');
      }
      function choose(i) {
        if (select.selectedIndex !== i) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        refresh();
        close();
        trigger.focus();
      }

      trigger.addEventListener('click', function () { if (isOpen()) close(); else open(); });
      trigger.addEventListener('keydown', function (e) {
        var k = e.key;
        if (!isOpen()) {
          if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); open(); }
          return;
        }
        if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
        else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
        else if (k === 'Home') { e.preventDefault(); setActive(0); }
        else if (k === 'End') { e.preventDefault(); setActive(items.length - 1); }
        else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
        else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        else if (k === 'Tab') { close(); }
      });
      select.addEventListener('change', refresh);
      if (label) label.addEventListener('click', function (e) { e.preventDefault(); trigger.focus(); });
      closers.push(function (except) { if (except !== wrap && isOpen()) close(); });
      document.addEventListener('click', function (e) { if (!wrap.contains(e.target) && isOpen()) close(); });
      refresh();
    });
  })();

  /* ---------- Tanda tanya penjelasan asumsi kalkulator ----------
     Di desktop tooltip muncul lewat hover/fokus (CSS). Klik/ketuk mengatur
     aria-expanded supaya tetap bisa dibuka di layar sentuh; ketuk di luar
     atau tekan Escape untuk menutup. */
  var helpButtons = document.querySelectorAll('.calc-help');
  function closeHelp() {
    helpButtons.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }
  helpButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') === 'true';
      closeHelp();
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });
  document.addEventListener('click', closeHelp);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeHelp(); });

  /* ---------- Google Analytics: klik WhatsApp sebagai konversi ----------
     Setiap link WhatsApp diberi atribut data-wa berisi posisinya (hero,
     navbar, founding, harga_essential, dst.), sehingga di GA4 terlihat
     tombol mana yang paling banyak menghasilkan kontak. Link dibuka di tab
     baru, jadi event sempat terkirim tanpa perlu menahan navigasi. */
  document.querySelectorAll('a[data-wa]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', 'klik_whatsapp', {
        lokasi_cta: link.getAttribute('data-wa'),
        link_text: (link.textContent || '').trim().slice(0, 60)
      });
    });
  });

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
