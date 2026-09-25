/*
 * Penurunan konsolidasi primer satu dimensi dan lajunya (teori Terzaghi).
 *
 * Besar penurunan (σ'0 dan Δσ' di tengah lapisan):
 * - NC (σ'c = σ'0):            Sc = Cc H/(1+e0) log[(σ'0+Δσ')/σ'0]
 * - OC, σ'0+Δσ' ≤ σ'c:         Sc = Cs H/(1+e0) log[(σ'0+Δσ')/σ'0]
 * - OC, σ'0 < σ'c < σ'0+Δσ':   Sc = Cs H/(1+e0) log(σ'c/σ'0) + Cc H/(1+e0) log[(σ'0+Δσ')/σ'c]
 *
 * Tambahan tegangan (opsional): metode 2:1, Δσ = q B L / [(B+z)(L+z)].
 *
 * Laju: Tv = cv t / Hdr², U(Tv) = 1 − Σ (2/M²) exp(−M² Tv), M = (2m+1)π/2.
 * Satuan: m, kPa, tahun.
 */
(function (root) {
  'use strict';

  var log10 = function (x) { return Math.log(x) / Math.LN10; };

  // Derajat konsolidasi rata-rata dari faktor waktu (deret eksak).
  function derajatU(Tv) {
    if (Tv <= 0) return 0;
    var jumlah = 0;
    for (var m = 0; m < 200; m++) {
      var M = (2 * m + 1) * Math.PI / 2;
      var suku = 2 / (M * M) * Math.exp(-M * M * Tv);
      jumlah += suku;
      if (suku < 1e-14) break;
    }
    return Math.max(0, Math.min(1, 1 - jumlah));
  }

  // Faktor waktu untuk derajat konsolidasi U (0 < U < 1), dicari dengan bagi dua.
  function faktorWaktu(U) {
    var a = 0, b = 10;
    for (var i = 0; i < 200; i++) {
      var c = (a + b) / 2;
      if (derajatU(c) < U) a = c; else b = c;
    }
    return (a + b) / 2;
  }

  function tambahanTegangan(m) {
    if (m.modeDelta === 'manual') return { mode: 'manual', delta: m.delta };
    var BL = m.bentuk2 === 'lajur';
    var delta = BL ? m.q * m.B2 / (m.B2 + m.z) : m.q * m.B2 * m.L2 / ((m.B2 + m.z) * (m.L2 + m.z));
    return { mode: '2:1', lajur: BL, delta: delta };
  }

  function periksa(m) {
    var g = [];
    if (!(m.H > 0)) g.push('Tebal lapisan H harus lebih dari 0.');
    if (!(m.e0 > 0)) g.push('Angka pori awal e0 harus lebih dari 0.');
    if (!(m.Cc > 0)) g.push('Indeks kompresi Cc harus lebih dari 0.');
    if (!(m.Cs >= 0)) g.push('Indeks pengembangan Cs tidak boleh negatif.');
    if (!(m.s0 > 0)) g.push('Tegangan efektif awal σ\'0 harus lebih dari 0.');
    if (!(m.sc > 0)) g.push('Tegangan prakonsolidasi σ\'c harus lebih dari 0.');
    else if (m.sc < m.s0 - 1e-9) g.push('σ\'c lebih kecil dari σ\'0 (tanah belum terkonsolidasi penuh). Kalkulator ini tidak menangani kondisi tersebut.');
    if (m.modeDelta === 'manual' && !(m.delta > 0)) g.push('Tambahan tegangan Δσ\' harus lebih dari 0.');
    if (m.modeDelta === '2:1') {
      if (!(m.q > 0)) g.push('Tekanan pondasi q harus lebih dari 0.');
      if (!(m.B2 > 0)) g.push('Lebar pondasi B harus lebih dari 0.');
      if (m.bentuk2 !== 'lajur' && !(m.L2 >= m.B2)) g.push('Panjang pondasi L harus lebih besar atau sama dengan B.');
      if (!(m.z >= 0)) g.push('Kedalaman z tidak boleh negatif.');
    }
    if (!(m.cv > 0)) g.push('Koefisien konsolidasi cv harus lebih dari 0.');
    return g;
  }

  function hitung(m) {
    var galat = periksa(m);
    if (galat.length) return { galat: galat };
    var T = tambahanTegangan(m);
    var s1 = m.s0 + T.delta;
    var a = m.H / (1 + m.e0);
    var kasus, Sc, bagian;
    if (Math.abs(m.sc - m.s0) < 1e-9) {
      kasus = 'NC';
      Sc = m.Cc * a * log10(s1 / m.s0);
      bagian = { nc: Sc };
    } else if (s1 <= m.sc) {
      kasus = 'OC1';
      Sc = m.Cs * a * log10(s1 / m.s0);
      bagian = { oc: Sc };
    } else {
      kasus = 'OC2';
      var p1 = m.Cs * a * log10(m.sc / m.s0), p2 = m.Cc * a * log10(s1 / m.sc);
      Sc = p1 + p2;
      bagian = { oc: p1, nc: p2 };
    }
    var Hdr = m.drainase === 'dua' ? m.H / 2 : m.H;
    var t50 = faktorWaktu(0.5) * Hdr * Hdr / m.cv;
    var t90 = faktorWaktu(0.9) * Hdr * Hdr / m.cv;
    var hasilT = null;
    if (m.t > 0) {
      var Tv = m.cv * m.t / (Hdr * Hdr);
      var U = derajatU(Tv);
      hasilT = { Tv: Tv, U: U, St: U * Sc };
    }
    var peringatan = [];
    if (m.Cs > m.Cc) peringatan.push('Cs lebih besar dari Cc. Biasanya Cs jauh lebih kecil (sekitar 1/5 sampai 1/10 Cc); periksa data.');
    return {
      galat: [], T: T, s1: s1, OCR: m.sc / m.s0, a: a, kasus: kasus, Sc: Sc, bagian: bagian,
      Hdr: Hdr, t50: t50, t90: t90, hasilT: hasilT, peringatan: peringatan
    };
  }

  var api = { hitung: hitung, derajatU: derajatU, faktorWaktu: faktorWaktu };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Konsolidasi = api;
})(this);
