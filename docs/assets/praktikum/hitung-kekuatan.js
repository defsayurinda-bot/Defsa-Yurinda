/*
 * Kuat geser langsung (SNI 3420:2016) dan kuat tekan bebas (SNI 3638:2012, berdasarkan ASTM D2166).
 *
 * Geser langsung:
 *   Gaya geser = bacaan arloji × kalibrasi cincin;  τ = gaya geser / A;  σn = P / A.
 *   Koreksi luas (opsional) untuk benda uji bulat berdiameter D yang bergeser δ:
 *     A_c = (D²/2)(θ − sin θ cos θ), θ = arccos(δ/D);  untuk benda uji persegi bersisi B: A_c = B (B − δ).
 *   Garis keruntuhan Mohr–Coulomb τf = c + σn tan φ dengan kuadrat terkecil dari τ puncak tiap benda uji.
 *
 * Kuat tekan bebas:
 *   ε = ΔL / L0;  A = A0 / (1 − ε);  σ = P / A.
 *   qu = tegangan puncak, atau tegangan pada ε = 15% bila puncak belum tercapai (ASTM D2166).
 *   cu = qu / 2;  sensitivitas St = qu / qu teremas (opsional);  E50 = (qu/2) / ε50.
 *   Konsistensi lempung menurut qu (Das, Principles of Geotechnical Engineering): sangat lunak < 25 kPa,
 *   lunak 25–50, sedang 50–100, kaku 100–200, sangat kaku 200–400, keras > 400 kPa.
 */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./hitung-dasar.js') : root.HitungDasar;
  var KG_CM2_KPA = 98.0665;

  function luasTerkoreksi(bentuk, ukuran, delta) {
    if (bentuk === 'persegi') return ukuran * (ukuran - delta);
    var th = Math.acos(Math.min(1, delta / ukuran));
    return ukuran * ukuran / 2 * (th - Math.sin(th) * Math.cos(th));
  }

  function geserLangsung(m) {
    var galat = [], peringatan = [];
    if (!(m.ukuran > 0)) galat.push('Isi ' + (m.bentuk === 'persegi' ? 'sisi' : 'diameter') + ' benda uji.');
    if (!(m.kalibrasi > 0)) galat.push('Isi kalibrasi cincin beban.');
    if (m.benda.length < 2) galat.push('Isi beban normal minimal dua benda uji.');
    if (!m.bacaan.length) galat.push('Isi bacaan arloji geser.');
    if (galat.length) return { galat: galat };
    var A0 = m.bentuk === 'persegi' ? m.ukuran * m.ukuran : Math.PI * m.ukuran * m.ukuran / 4; // cm²
    var bacaan = m.bacaan.slice().sort(function (a, b) { return a.geser - b.geser; });
    var benda = m.benda.map(function (b, j) {
      var kurva = [];
      bacaan.forEach(function (r) {
        var v = r.nilai[j];
        if (v === null || v === undefined) return;
        var A = m.koreksiLuas === 'ya' ? luasTerkoreksi(m.bentuk, m.ukuran, r.geser / 10) : A0;
        var gaya = v * m.kalibrasi;
        kurva.push({ geser: r.geser, bacaan: v, gaya: gaya, A: A, tau: gaya / A, sigma: b.P / A });
      });
      var puncak = kurva.reduce(function (a, k) { return !a || k.tau > a.tau ? k : a; }, null);
      return { nama: b.nama, P: b.P, sigma0: b.P / A0, kurva: kurva, puncak: puncak };
    }).filter(function (b) { return b.puncak; });
    if (benda.length < 2) return { galat: ['Minimal dua benda uji harus punya bacaan arloji geser.'] };
    benda.forEach(function (b) {
      var akhir = b.kurva[b.kurva.length - 1];
      if (b.puncak === akhir) peringatan.push('Benda uji ' + b.nama + ': tegangan geser masih naik pada bacaan terakhir. Puncak diambil dari bacaan terakhir; pertimbangkan batas penggeseran (mis. 10–20% diameter).');
    });
    var x = benda.map(function (b) { return b.puncak.sigma; }), y = benda.map(function (b) { return b.puncak.tau; });
    var reg = D.regresiLinier(x, y);
    var phi = Math.atan(reg.b) * 180 / Math.PI;
    if (reg.b < 0) peringatan.push('Garis keruntuhan menurun (φ negatif). Periksa beban normal dan bacaan arloji tiap benda uji.');
    if (reg.a < -1e-9) peringatan.push('Kohesi hasil regresi negatif. Secara fisik biasanya dilaporkan c = 0 dengan φ dari garis melalui titik asal; periksa data.');
    if (benda.length > 2 && reg.r2 < 0.9) peringatan.push('Titik τ–σ kurang segaris (R² = ' + reg.r2.toFixed(3).replace('.', ',') + ').');
    return { galat: [], peringatan: peringatan, A0: A0, benda: benda, c: reg.a, tanPhi: reg.b, phi: phi, r2: reg.r2, kPa: KG_CM2_KPA };
  }

  function konsistensi(quKPa) {
    var batas = [[25, 'Sangat lunak'], [50, 'Lunak'], [100, 'Sedang'], [200, 'Kaku'], [400, 'Sangat kaku']];
    for (var i = 0; i < batas.length; i++) if (quKPa < batas[i][0]) return batas[i][1];
    return 'Keras';
  }

  // Tegangan dalam satuan beban per cm²: kg → kg/cm², kN → kN/cm². Faktor ke kPa: 98,0665 atau 10 000.
  function tekanBebas(m) {
    var galat = [], peringatan = [];
    if (!(m.diameter > 0 && m.tinggi > 0)) galat.push('Isi diameter dan tinggi benda uji.');
    if (!(m.satuanRegangan > 0)) galat.push('Isi satuan arloji regangan.');
    if (!(m.kalibrasi > 0)) galat.push('Isi kalibrasi cincin beban.');
    if (m.bacaan.length < 3) galat.push('Isi minimal tiga bacaan.');
    if (galat.length) return { galat: galat };
    var A0 = Math.PI * m.diameter * m.diameter / 4, keKPa = m.satuanBeban === 'kN' ? 10000 : KG_CM2_KPA;
    var baca = m.bacaan.slice().sort(function (a, b) { return a.regangan - b.regangan; });
    var titik = baca.map(function (b) {
      var dL = (b.regangan - baca[0].regangan) * m.satuanRegangan / 10; // cm
      var eps = dL / m.tinggi, A = A0 / (1 - eps), P = b.beban * m.kalibrasi;
      return Object.assign({}, b, { dL: dL, eps: eps * 100, A: A, P: P, sigma: P / A, kPa: P / A * keKPa });
    });
    var batas = titik.filter(function (t) { return t.eps <= 15 + 1e-9; });
    var puncak = batas.reduce(function (a, t) { return !a || t.sigma > a.sigma ? t : a; }, null);
    var qu = puncak.sigma, caraQu = 'puncak', epsQu = puncak.eps;
    var turun = titik.some(function (t) { return t.eps > puncak.eps && t.sigma < puncak.sigma * 0.98; });
    if (!turun && puncak === batas[batas.length - 1]) {
      var akhir = titik[titik.length - 1];
      if (akhir.eps >= 15) {
        for (var i = 0; i < titik.length - 1; i++) {
          if (titik[i].eps <= 15 && titik[i + 1].eps >= 15) {
            var a = titik[i], b = titik[i + 1];
            qu = a.sigma + (b.sigma - a.sigma) * (15 - a.eps) / (b.eps - a.eps);
          }
        }
        caraQu = 'regangan 15%'; epsQu = 15;
      } else {
        peringatan.push('Tegangan masih naik pada bacaan terakhir (regangan ' + akhir.eps.toFixed(2).replace('.', ',') + '%). Pengujian dihentikan pada puncak atau regangan 15%.');
      }
    }
    var quKPa = qu * keKPa;
    // Regangan pada 50% qu untuk modulus sekan E50.
    var eps50 = null;
    for (var j = 0; j < titik.length - 1; j++) {
      var p1 = titik[j], p2 = titik[j + 1];
      if (p1.sigma <= qu / 2 && p2.sigma >= qu / 2 && p2.sigma > p1.sigma) { eps50 = p1.eps + (qu / 2 - p1.sigma) * (p2.eps - p1.eps) / (p2.sigma - p1.sigma); break; }
    }
    var hasil = { galat: [], peringatan: peringatan, A0: A0, keKPa: keKPa, titik: titik, puncak: puncak, qu: qu, quKPa: quKPa, cu: qu / 2, cuKPa: quKPa / 2,
      caraQu: caraQu, epsQu: epsQu, konsistensi: konsistensi(quKPa), eps50: eps50 };
    if (eps50 > 0) hasil.E50 = (quKPa / 2) / (eps50 / 100);
    if (m.quRemas > 0) hasil.St = quKPa / m.quRemas; // q_u teremas dalam kPa
    if (m.berat > 0) {
      hasil.gamma = m.berat / (A0 * m.tinggi);
      if (m.w >= 0) hasil.gammaD = hasil.gamma / (1 + m.w / 100);
    }
    if (m.tinggi / m.diameter < 2 || m.tinggi / m.diameter > 2.5) peringatan.push('Perbandingan tinggi terhadap diameter ' + (m.tinggi / m.diameter).toFixed(2).replace('.', ',') + '. ASTM D2166 menyarankan 2 sampai 2,5.');
    return hasil;
  }

  var api = { geserLangsung: geserLangsung, luasTerkoreksi: luasTerkoreksi, tekanBebas: tekanBebas, konsistensi: konsistensi };
  if (node) module.exports = api;
  else root.HitungKekuatan = api;
})(this);
