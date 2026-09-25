/* Pencarian seluruh situs dari indeks cari.json yang dibangun skrip/bangun_situs.py. */
(function () {
  'use strict';
  var indeks = [];
  var isian = document.getElementById('kataCari');
  var hasil = document.getElementById('hasilCari');
  var info = document.getElementById('infoCari');

  // Huruf kecil dan tanpa tanda diakritik, supaya "sigma" dan "σ" tetap dicari apa adanya tapi "é" = "e".
  function normal(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function cari(q) {
    var kata = normal(q).split(/\s+/).filter(Boolean);
    if (!kata.length) return [];
    return indeks.map(function (x) {
      var judul = normal(x.j), semua = judul + ' ' + normal(x.d) + ' ' + normal(x.h);
      if (!kata.every(function (k) { return semua.indexOf(k) >= 0; })) return null;
      var skor = kata.reduce(function (s, k) { return s + (judul.indexOf(k) >= 0 ? 2 : 0) + (normal(x.d).indexOf(k) >= 0 ? 1 : 0); }, 0);
      return { x: x, skor: skor };
    }).filter(Boolean).sort(function (a, b) { return b.skor - a.skor; }).map(function (r) { return r.x; });
  }

  function tampilkan() {
    var q = isian.value.trim();
    hasil.textContent = '';
    if (!q) { info.textContent = 'Ketik kata yang dicari, misalnya "konsolidasi", "CBR", atau "git".'; return; }
    var r = cari(q);
    info.textContent = r.length ? r.length + ' hasil untuk "' + q + '".' : 'Tidak ada hasil untuk "' + q + '".';
    r.forEach(function (x) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '../' + x.u;
      a.textContent = x.j;
      var jenis = document.createElement('span');
      jenis.className = 'lencana';
      jenis.textContent = x.k;
      var d = document.createElement('p');
      d.className = 'kecil redup';
      d.textContent = x.d;
      li.appendChild(jenis); li.appendChild(document.createTextNode(' ')); li.appendChild(a); li.appendChild(d);
      hasil.appendChild(li);
    });
  }

  function mulai() {
    var q = new URLSearchParams(location.search).get('q') || '';
    isian.value = q;
    fetch('../cari.json').then(function (r) { return r.json(); }).then(function (d) { indeks = d; tampilkan(); },
      function () { info.textContent = 'Indeks pencarian gagal dimuat.'; });
    isian.addEventListener('input', function () {
      tampilkan();
      try { history.replaceState(null, '', isian.value ? '?q=' + encodeURIComponent(isian.value) : location.pathname); } catch (e) { /* abaikan */ }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
})();
