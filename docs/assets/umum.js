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
  function salinTautan(elPesan) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(
        function () { elPesan.textContent = 'Tautan disalin. Siapa pun yang membukanya akan melihat data yang sama.'; },
        function () { elPesan.textContent = 'Salin tautan dari bilah alamat browser.'; });
    } else elPesan.textContent = 'Salin tautan dari bilah alamat browser.';
  }

  window.Umum = {
    $: function (id) { return document.getElementById(id); },
    salin: function (o) { return JSON.parse(JSON.stringify(o)); },
    f: f, t: t, tex: tex, rumus: rumus,
    simpanKeHash: simpanKeHash, bacaHash: bacaHash, salinTautan: salinTautan,
    KN_PER_TON: 9.80665
  };
})();
