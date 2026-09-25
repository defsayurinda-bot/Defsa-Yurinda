/* Tampilan bank soal: pilih topik, soal acak, periksa jawaban, pembahasan, skor. */
(function () {
  'use strict';

  var U = window.Umum, L = window.Latihan;
  var $ = U.$, f = U.f, rumus = U.rumus;
  var F = { f: f, t: U.t };
  var KUNCI_SKOR = 'latihan-geoteknik-skor';
  var topik = 'semua';
  var soal = null, sudahDijawab = false;
  var skor = bacaSkor();

  // ---------- Skor (hanya di browser ini) ----------
  function bacaSkor() {
    try {
      var o = JSON.parse(localStorage.getItem(KUNCI_SKOR));
      if (o && Array.isArray(o.riwayat)) return o;
    } catch (e) { /* penyimpanan tidak tersedia */ }
    return { benar: 0, dicoba: 0, riwayat: [] };
  }
  function simpanSkor() {
    try { localStorage.setItem(KUNCI_SKOR, JSON.stringify(skor)); } catch (e) { /* abaikan */ }
  }
  function gambarSkor() {
    $('skor').innerHTML = skor.benar + ' <small>/ ' + skor.dicoba + '</small>';
    $('skorKet').textContent = skor.dicoba ? 'Benar ' + f(skor.benar / skor.dicoba * 100, 0) + '% dari soal yang dijawab.' : 'Belum ada soal yang dijawab.';
    $('riwayat').innerHTML = skor.riwayat.slice(-6).reverse().map(function (r) {
      return '<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid var(--garis)"><span>' + r.judul + '</span><strong style="color:' + (r.benar ? 'var(--sukses)' : 'var(--aksen)') + '">' + (r.benar ? '✓' : '✗') + '</strong></div>';
    }).join('');
  }

  // ---------- Topik ----------
  function gambarTopik() {
    var pilihan = [['semua', 'Semua topik']].concat(Object.keys(L.TOPIK).map(function (k) { return [k, L.TOPIK[k]]; }));
    $('pilihTopik').innerHTML = pilihan.map(function (p) {
      return '<button type="button" class="tombol kecil' + (p[0] === topik ? ' utama' : '') + '" data-topik="' + p[0] + '" aria-pressed="' + (p[0] === topik) + '">' + p[1] + '</button>';
    }).join('');
    $('pilihTopik').querySelectorAll('[data-topik]').forEach(function (b) {
      b.addEventListener('click', function () { topik = b.dataset.topik; gambarTopik(); soalBaru(); });
    });
  }

  // ---------- Soal ----------
  function soalBaru() {
    var daftar = L.TEMPLAT_AKTIF.filter(function (x) { return topik === 'semua' || x.topik === topik; });
    var tp = daftar[Math.floor(Math.random() * daftar.length)];
    var seed = Math.floor(Math.random() * 900000) + 100000;
    tampilkan(tp.id, seed);
  }

  function tampilkan(id, seed) {
    var aktif = L.TEMPLAT_AKTIF.some(function (x) { return x.id === id; });
    soal = aktif ? L.buatSoal(id, seed, F) : null;
    if (!soal) return soalBaru();
    sudahDijawab = false;
    try { history.replaceState(null, '', '#' + id + '/' + seed); } catch (e) { /* abaikan */ }
    $('kartuSoal').innerHTML =
      '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">' +
        '<span class="lencana">' + L.TOPIK[soal.topik] + '</span>' +
        '<span class="kecil redup">Kode soal ' + seed + '</span></div>' +
      '<h3 style="margin-top:8px">' + soal.judul + '</h3>' +
      '<p>' + soal.teks + '</p><p><strong>' + soal.tanya + '</strong></p>' +
      '<form id="formJawab" class="isian-kisi" style="align-items:end" onsubmit="return false">' +
        '<div><label for="jawaban">Jawabanmu' + (soal.satuan !== '–' ? ' (' + soal.satuan + ')' : '') + '</label>' +
        '<input id="jawaban" type="text" inputmode="decimal" autocomplete="off" placeholder="contoh: 123,45"></div>' +
        '<div class="baris-tombol" style="margin:0"><button type="submit" class="tombol utama" id="periksa">Periksa</button></div>' +
      '</form>' +
      '<div id="umpanBalik" role="status"></div>' +
      '<div class="baris-tombol tidak-cetak">' +
        '<button type="button" class="tombol kecil" id="lihatBahas">Lihat pembahasan</button>' +
        '<button type="button" class="tombol kecil" id="soalLain">Soal berikutnya →</button>' +
        '<button type="button" class="tombol kecil" id="bagikanSoal">Salin tautan soal</button>' +
      '</div><p id="pesanBagikan" class="kecil redup" role="status"></p>' +
      '<div id="pembahasan"></div>';
    $('formJawab').addEventListener('submit', periksa);
    $('lihatBahas').addEventListener('click', tampilkanPembahasan);
    $('soalLain').addEventListener('click', soalBaru);
    $('bagikanSoal').addEventListener('click', function () { U.salinTautan($('pesanBagikan')); });
    $('jawaban').focus({ preventScroll: true });
  }

  // Menerima "1.234,5", "1234,5", atau "1234.5".
  function bacaAngka(s) {
    s = String(s).trim().replace(/\s/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    return Number(s);
  }

  function periksa() {
    var nilai = bacaAngka($('jawaban').value);
    var el = $('umpanBalik');
    if (!isFinite(nilai)) { el.innerHTML = '<div class="catatan">Isi jawaban dengan angka, misalnya 123,45.</div>'; return; }
    var benar = L.periksaJawaban(nilai, soal.jawaban);
    var selisih = (nilai - soal.jawaban) / soal.jawaban * 100;
    if (!sudahDijawab) {
      sudahDijawab = true;
      skor.dicoba++;
      if (benar) skor.benar++;
      skor.riwayat.push({ judul: soal.judul, benar: benar });
      if (skor.riwayat.length > 50) skor.riwayat.shift();
      simpanSkor();
      gambarSkor();
    }
    el.innerHTML = benar
      ? '<div class="catatan" style="background:color-mix(in srgb, var(--sukses) 14%, transparent);color:var(--sukses)"><strong>Benar.</strong> Kunci: ' + f(soal.jawaban, soal.desimal) + (soal.satuan !== '–' ? ' ' + soal.satuan : '') + ' (selisih ' + f(Math.abs(selisih), 2) + '%).</div>'
      : '<div class="catatan galat"><strong>Belum tepat.</strong> Jawabanmu ' + (selisih > 0 ? 'lebih besar' : 'lebih kecil') + ' ' + f(Math.abs(selisih), 1) + '% dari kunci. ' +
        (Math.abs(Math.abs(selisih) - 99.9) < 0.2 || Math.abs(nilai / soal.jawaban - 1000) < 20 ? 'Periksa satuan (m dan mm, kN dan ton). ' : '') +
        'Coba lagi atau buka pembahasan.</div>';
  }

  function tampilkanPembahasan() {
    var langkah = soal.langkah(F);
    $('pembahasan').innerHTML = '<h3>Pembahasan</h3>' + langkah.map(function (l, i) {
      return '<div class="langkah"><h4>' + String.fromCharCode(97 + i) + '. ' + l.judul + '</h4>' +
        (l.teks ? '<p>' + l.teks + '</p>' : '') + (l.tex || []).map(rumus).join('') + '</div>';
    }).join('') +
      '<p><strong>Kunci: ' + f(soal.jawaban, soal.desimal) + (soal.satuan !== '–' ? ' ' + soal.satuan : '') + '</strong></p>' +
      '<p class="kecil redup">Ingin melihat hitungan lengkapnya? Masukkan data yang sama ke <a href="../#alat">kalkulator</a>.</p>';
  }

  function mulai() {
    gambarTopik();
    gambarSkor();
    $('aturUlang').addEventListener('click', function () { skor = { benar: 0, dicoba: 0, riwayat: [] }; simpanSkor(); gambarSkor(); });
    var m = /^#([a-z0-9-]+)\/(\d+)$/.exec(location.hash);
    if (m) tampilkan(m[1], +m[2]); else soalBaru();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
})();
