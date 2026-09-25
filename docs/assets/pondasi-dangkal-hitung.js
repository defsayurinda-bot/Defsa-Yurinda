/*
 * Kapasitas dukung pondasi dangkal dengan persamaan daya dukung umum
 * (bentuk yang dipakai Das, Principles of Foundation Engineering).
 *
 *   qu = c' Nc Fcs Fcd + q Nq Fqs Fqd + ½ γ B Nγ Fγs Fγd
 *
 * - Nq = tan²(45 + φ/2) e^(π tan φ)       (Reissner, 1924)
 * - Nc = (Nq − 1) cot φ; φ = 0 → π + 2   (Prandtl, 1921)
 * - Nγ = 2 (Nq + 1) tan φ                 (Vesic, 1973)
 * - Faktor bentuk: De Beer (1970)
 * - Faktor kedalaman: Hansen (1970)
 * - Koreksi muka air tanah: tiga kasus sesuai Das
 *
 * Beban vertikal sentris (tanpa faktor kemiringan). Satuan: m, kN, kPa.
 */
(function (root) {
  'use strict';

  var GAMMA_W = 9.81;
  var rad = function (deg) { return deg * Math.PI / 180; };

  function faktorDayaDukung(phi) {
    var p = rad(phi), tn = Math.tan(p);
    var Nq = Math.pow(Math.tan(Math.PI / 4 + p / 2), 2) * Math.exp(Math.PI * tn);
    var Nc = phi === 0 ? Math.PI + 2 : (Nq - 1) / tn;
    var Ng = 2 * (Nq + 1) * tn;
    return { Nc: Nc, Nq: Nq, Ng: Ng };
  }

  // Rasio B/L yang dipakai faktor bentuk: lajur 0, lingkaran dan bujur sangkar 1.
  function rasioBL(m) {
    if (m.bentuk === 'lajur') return 0;
    if (m.bentuk === 'persegi-panjang') return m.B / m.L;
    return 1;
  }

  function faktorBentuk(BL, phi, N) {
    return {
      Fcs: 1 + BL * (N.Nq / N.Nc),
      Fqs: 1 + BL * Math.tan(rad(phi)),
      Fgs: 1 - 0.4 * BL
    };
  }

  function faktorKedalaman(Df, B, phi, N) {
    var r = Df / B;
    var k = r <= 1 ? r : Math.atan(r); // radian bila Df/B > 1
    if (phi === 0) return { k: k, pakaiAtan: r > 1, Fcd: 1 + 0.4 * k, Fqd: 1, Fgd: 1 };
    var p = rad(phi);
    var Fqd = 1 + 2 * Math.tan(p) * Math.pow(1 - Math.sin(p), 2) * k;
    var Fcd = Fqd - (1 - Fqd) / (N.Nc * Math.tan(p));
    return { k: k, pakaiAtan: r > 1, Fcd: Fcd, Fqd: Fqd, Fgd: 1 };
  }

  // Tekanan efektif di dasar pondasi (q) dan γ untuk suku ketiga.
  function mukaAir(m) {
    var gEf = m.gammaSat - GAMMA_W;
    if (!m.adaMAT || m.dw >= m.Df + m.B) {
      return { kasus: 3, q: m.gamma * m.Df, gammaSuku3: m.gamma, gEf: gEf };
    }
    if (m.dw <= m.Df) {
      return { kasus: 1, q: m.gamma * m.dw + gEf * (m.Df - m.dw), gammaSuku3: gEf, gEf: gEf };
    }
    var d = m.dw - m.Df;
    return { kasus: 2, d: d, q: m.gamma * m.Df, gammaSuku3: gEf + (d / m.B) * (m.gamma - gEf), gEf: gEf };
  }

  function luasDasar(m) {
    if (m.bentuk === 'lajur') return m.B;               // per meter panjang
    if (m.bentuk === 'lingkaran') return Math.PI * m.B * m.B / 4;
    if (m.bentuk === 'persegi-panjang') return m.B * m.L;
    return m.B * m.B;
  }

  function periksa(m) {
    var g = [];
    if (!(m.B > 0)) g.push('Lebar B harus lebih dari 0.');
    if (m.bentuk === 'persegi-panjang' && !(m.L >= m.B)) g.push('Panjang L harus lebih besar atau sama dengan lebar B.');
    if (!(m.Df >= 0)) g.push('Kedalaman Df tidak boleh negatif.');
    if (!(m.phi >= 0 && m.phi <= 50)) g.push('Sudut geser φ\' harus antara 0° dan 50°.');
    if (!(m.c >= 0)) g.push('Kohesi c\' tidak boleh negatif.');
    if (!(m.gamma > 0)) g.push('Berat volume γ harus lebih dari 0.');
    if (m.adaMAT && !(m.dw >= 0)) g.push('Kedalaman muka air tanah tidak boleh negatif.');
    if (m.adaMAT && m.dw < m.Df + m.B && !(m.gammaSat > GAMMA_W)) g.push('γsat harus lebih besar dari γw = 9,81 kN/m³.');
    if (!(m.FS > 0)) g.push('Faktor keamanan harus lebih dari 0.');
    return g;
  }

  function hitung(m) {
    var galat = periksa(m);
    if (galat.length) return { galat: galat };
    var N = faktorDayaDukung(m.phi);
    var BL = rasioBL(m);
    var S = faktorBentuk(BL, m.phi, N);
    var D = faktorKedalaman(m.Df, m.B, m.phi, N);
    var A = mukaAir(m);
    var suku1 = m.c * N.Nc * S.Fcs * D.Fcd;
    var suku2 = A.q * N.Nq * S.Fqs * D.Fqd;
    var suku3 = 0.5 * A.gammaSuku3 * m.B * N.Ng * S.Fgs * D.Fgd;
    var qu = suku1 + suku2 + suku3;
    var luas = luasDasar(m);
    var peringatan = [];
    if (m.Df / m.B > 1) peringatan.push('Df/B > 1: faktor kedalaman memakai tan⁻¹(Df/B). Periksa apakah pondasi masih tergolong dangkal.');
    if (m.phi > 40) peringatan.push('φ\' di atas 40° jarang dipakai untuk desain; faktor daya dukung naik sangat tajam.');
    return {
      galat: [], N: N, BL: BL, S: S, D: D, A: A,
      suku1: suku1, suku2: suku2, suku3: suku3, qu: qu,
      qall: qu / m.FS, quNet: qu - A.q, qallNet: (qu - A.q) / m.FS,
      luas: luas, Qall: qu / m.FS * luas, peringatan: peringatan
    };
  }

  var api = { hitung: hitung, faktorDayaDukung: faktorDayaDukung, GAMMA_W: GAMMA_W };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PondasiDangkal = api;
})(this);
