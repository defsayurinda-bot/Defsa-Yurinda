/*
 * Batas Atterberg: batas cair (SNI 1967:2008), batas plastis dan indeks plastisitas (SNI 1966:2008).
 *
 * Batas cair, dua cara:
 * - Banyak titik: kurva aliran w = a + b·log N (kuadrat terkecil), LL = w pada N = 25.
 * - Satu titik: LL = w_N (N/25)^β, β = 0,121 (ASTM D4318 metode B), untuk N sekitar 20–30.
 * Batas plastis: rata-rata kadar air benang tanah. IP = LL − PL.
 * Bila PL ≥ LL, tanah dilaporkan nonplastis (NP).
 *
 * Posisi di bagan plastisitas (tanah berbutir halus anorganik, SNI 6371:2015 / ASTM D2487):
 *   garis A: IP = 0,73 (LL − 20); garis U: IP = 0,9 (LL − 8).
 */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./hitung-dasar.js') : root.HitungDasar;

  function garisA(LL) { return 0.73 * (LL - 20); }
  function garisU(LL) { return 0.9 * (LL - 8); }

  // Simbol kelompok tanah halus dari LL dan IP (tanpa pengujian organik).
  function simbolHalus(LL, IP) {
    var A = garisA(LL);
    if (LL < 50) {
      if (IP > 7 && IP >= A) return { simbol: 'CL', nama: 'Lempung plastisitas rendah' };
      if (IP >= 4 && IP <= 7 && IP >= A) return { simbol: 'CL-ML', nama: 'Lempung berlanau' };
      return { simbol: 'ML', nama: 'Lanau' };
    }
    if (IP >= A) return { simbol: 'CH', nama: 'Lempung plastisitas tinggi' };
    return { simbol: 'MH', nama: 'Lanau plastisitas tinggi' };
  }

  function hitung(m) {
    var galat = [], peringatan = [];
    var eks = m.eksponen > 0 ? m.eksponen : 0.121;

    var titikLL = m.ll.map(function (t) {
      var k = D.kadarAir(t.W1, t.W2, t.W3);
      if (!(t.N > 0)) galat.push('Titik LL ' + t.nama + ': jumlah ketukan harus lebih dari 0.');
      if (!(t.W2 > t.W3)) galat.push('Titik LL ' + t.nama + ': W2 harus lebih besar dari W3.');
      return Object.assign({}, t, k, { LL1: k.w * Math.pow(t.N / 25, eks) });
    });
    var titikPL = m.pl.map(function (t) {
      var k = D.kadarAir(t.W1, t.W2, t.W3);
      if (!(t.W2 > t.W3)) galat.push('Cawan PL ' + t.nama + ': W2 harus lebih besar dari W3.');
      return Object.assign({}, t, k);
    });
    if (!titikLL.length) galat.push('Isi data batas cair minimal satu titik.');
    if (!titikPL.length) galat.push('Isi data batas plastis minimal satu cawan.');
    var Nberbeda = titikLL.map(function (t) { return t.N; }).filter(function (n, i, arr) { return arr.indexOf(n) === i; });
    if (m.metodeLL === 'banyak' && titikLL.length && Nberbeda.length < 2) {
      galat.push('Metode banyak titik membutuhkan minimal dua jumlah ketukan yang berbeda. Tambah titik atau pakai metode satu titik.');
    }
    if (galat.length) return { galat: galat };

    var LL, kurva = null;
    if (m.metodeLL === 'banyak') {
      kurva = D.regresiLinier(titikLL.map(function (t) { return Math.log10(t.N); }), titikLL.map(function (t) { return t.w; }));
      LL = kurva.a + kurva.b * Math.log10(25);
      var Nmin = Math.min.apply(null, Nberbeda), Nmaks = Math.max.apply(null, Nberbeda);
      if (Nmin > 25 || Nmaks < 25) peringatan.push('Jumlah ketukan tidak mengapit 25, sehingga LL diperoleh dengan ekstrapolasi. Sebaiknya ada titik di atas dan di bawah 25 ketukan.');
      if (kurva.b >= 0) peringatan.push('Kurva aliran tidak menurun (kadar air naik seiring jumlah ketukan). Periksa data.');
      if (titikLL.length >= 3 && kurva.r2 < 0.9) peringatan.push('Titik-titik kurang segaris (R² = ' + kurva.r2.toFixed(3).replace('.', ',') + '). Periksa titik yang menyimpang.');
    } else {
      LL = D.rata(titikLL.map(function (t) { return t.LL1; }));
      titikLL.forEach(function (t) {
        if (t.N < 20 || t.N > 30) peringatan.push('Titik ' + t.nama + ' (' + t.N + ' ketukan) di luar 20–30 ketukan; metode satu titik kurang tepat di luar rentang ini.');
      });
    }
    var PL = D.rata(titikPL.map(function (t) { return t.w; }));
    var NP = PL >= LL;
    var IP = NP ? 0 : LL - PL;
    var hasil = {
      galat: [], peringatan: peringatan, eksponen: eks, titikLL: titikLL, titikPL: titikPL, kurva: kurva,
      LL: LL, PL: PL, IP: IP, NP: NP, garisA: garisA(LL), garisU: garisU(LL)
    };
    if (NP) peringatan.push('PL ≥ LL, sehingga tanah dilaporkan nonplastis (NP).');
    else {
      hasil.klas = simbolHalus(LL, IP);
      if (IP > garisU(LL)) peringatan.push('Titik berada di atas garis U. Kombinasi LL dan IP ini jarang terjadi pada tanah asli; periksa kembali data.');
    }
    if (m.wn > 0 && !NP && IP > 0) {
      hasil.LI = (m.wn - PL) / IP;
      hasil.CI = (LL - m.wn) / IP;
    }
    return hasil;
  }

  var api = { hitung: hitung, garisA: garisA, garisU: garisU, simbolHalus: simbolHalus };
  if (node) module.exports = api;
  else root.HitungAtterberg = api;
})(this);
