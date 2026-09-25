/* Fungsi bersama untuk semua kalkulator: format angka, rumus KaTeX, dan tautan berbagi. */
(function () {
  'use strict';

  // Desimal koma, ribuan titik.
  function f(x, d) {
    if (d === undefined) d = 2;
    if (!isFinite(x)) return '–';
    return x.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  // Angka untuk di dalam rumus TeX (koma harus dibungkus supaya tidak diberi spasi).
  function t(x, d) { return f(x, d).replace(/,/g, '{,}'); }

  function tex(s, blok) {
    if (window.katex) {
      try { return katex.renderToString(s, { displayMode: !!blok, throwOnError: false }); } catch (e) { /* pakai cadangan */ }
    }
    return '<code>' + s.replace(/</g, '&lt;') + '</code>';
  }
  function rumus(s) { return '<div class="rumus">' + tex(s, true) + '</div>'; }

  function simpanKeHash(keadaan) {
    try { history.replaceState(null, '', '#' + btoa(JSON.stringify(keadaan))); } catch (e) { /* abaikan */ }
  }
  function bacaHash(cek) {
    try {
      if (location.hash.length > 1) {
        var o = JSON.parse(atob(location.hash.slice(1)));
        if (o && (!cek || cek(o))) return o;
      }
    } catch (e) { /* hash rusak diabaikan */ }
    return null;
  }
  // Isi tautan berbagi dianggap tidak tepercaya: teks yang memuat karakter HTML ditolak seluruhnya.
  function tanpaHTML(o) {
    if (typeof o === 'string') return !/[<>"'&`]/.test(o);
    if (o && typeof o === 'object') return Object.keys(o).every(function (k) { return tanpaHTML(k) && tanpaHTML(o[k]); });
    return true;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function salinTautan(elPesan) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(
        function () { elPesan.textContent = 'Tautan disalin. Siapa pun yang membukanya akan melihat data yang sama.'; },
        function () { elPesan.textContent = 'Salin tautan dari bilah alamat browser.'; });
    } else elPesan.textContent = 'Salin tautan dari bilah alamat browser.';
  }

  // Tombol "Laporkan salah hitung": membuka Issue baru dengan templat dan tautan hasil terisi.
  var REPO_ISSUE = 'https://github.com/defsayurinda/defsayurinda.github.io/issues/new';
  function namaAlat(jalur) {
    if (/kalkulator\/tiang-bor/.test(jalur)) return 'Tiang bor N-SPT';
    if (/kalkulator\/pondasi-dangkal/.test(jalur)) return 'Pondasi dangkal';
    if (/kalkulator\/konsolidasi/.test(jalur)) return 'Penurunan konsolidasi';
    if (/praktikum\//.test(jalur)) return 'Praktikum Mekanika Tanah';
    if (/latihan\//.test(jalur)) return 'Latihan soal';
    return 'Lainnya';
  }
  function tautanLaporan() {
    var judul = document.title.split(' · ')[0];
    return REPO_ISSUE + '?template=salah-hitung.yml' +
      '&title=' + encodeURIComponent('Salah hitung: ' + judul) +
      '&alat=' + encodeURIComponent(namaAlat(location.pathname)) +
      '&masukan=' + encodeURIComponent(location.href);
  }
  function pasangLaporan() {
    var main = document.querySelector('main');
    if (!main || !/kalkulator\/|praktikum\/[^/]+\/|latihan\//.test(location.pathname)) return;
    var bagian = document.createElement('section');
    bagian.className = 'tidak-cetak lapor';
    var h = document.createElement('h2'); h.textContent = 'Menemukan salah hitung?';
    var p = document.createElement('p');
    p.textContent = 'Laporkan lewat Issue di GitHub. Tautan hasil dan nama alat sudah terisi; tambahkan hasil yang kamu harapkan beserta sumbernya. ' +
      'Isi Issue terlihat publik, dan tautan hasil memuat data yang sedang kamu isi, jadi jangan kirim data proyek atau data pribadi.';
    var a = document.createElement('a');
    a.className = 'tombol'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Laporkan salah hitung';
    a.href = REPO_ISSUE;
    // Tautan dibuat saat diklik, supaya memuat data terakhir di formulir.
    a.addEventListener('click', function () { a.href = tautanLaporan(); });
    bagian.appendChild(h); bagian.appendChild(p); bagian.appendChild(a);
    main.appendChild(bagian);
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pasangLaporan);
    else pasangLaporan();
  }

  window.Umum = {
    $: function (id) { return document.getElementById(id); },
    salin: function (o) { return JSON.parse(JSON.stringify(o)); },
    f: f, t: t, tex: tex, rumus: rumus, esc: esc, tanpaHTML: tanpaHTML,
    simpanKeHash: simpanKeHash, bacaHash: bacaHash, salinTautan: salinTautan, tautanLaporan: tautanLaporan,
    KN_PER_TON: 9.80665
  };
})();
