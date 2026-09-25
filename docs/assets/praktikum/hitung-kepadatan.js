/*
 * Pemadatan di laboratorium (SNI 1742:2008 ringan, SNI 1743:2008 berat) dan
 * kepadatan lapangan dengan kerucut pasir (SNI 2828:2011).
 *
 * Pemadatan:
 *   γ = (massa tanah basah + cetakan − massa cetakan) / isi cetakan
 *   γd = γ / (1 + w)
 *   Garis rongga udara nol (ZAV): γzav = Gs·γw / (1 + w·Gs)
 *   w_opt dan γd maks dari kurva polinomial orde 2 atau 3 (dipilih pengguna) yang dicocokkan pada titik data.
 *
 * Kerucut pasir:
 *   γ pasir = (W2 − W1) / (W3 − W1)            W1 tabung, W2 tabung + pasir, W3 tabung + air (γw = 1 g/cm³)
 *   Pasir dalam lubang = (W8 − W9) − (W6 − W7)
 *   V lubang = pasir dalam lubang / γ pasir
 *   w = (W13 − W14) / (W14 − W12);  Wd = (W11 − W10) / (1 + w);  γd = Wd / V
 *   Derajat kepadatan D = γd lapangan / γd maks laboratorium × 100%
 */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./hitung-dasar.js') : root.HitungDasar;

  function pemadatan(m) {
    var galat = [], peringatan = [];
    if (!(m.Gs > 1)) galat.push('Gs harus diisi (biasanya 2,6–2,8).');
    if (!(m.V > 0)) galat.push('Isi cetakan harus lebih dari 0.');
    if (!(m.Mcetakan > 0)) galat.push('Massa cetakan harus lebih dari 0.');
    var gw = m.gammaW > 0 ? m.gammaW : 1;
    var titik = m.titik.map(function (t) {
      var k = D.kadarAir(t.W1, t.W2, t.W3);
      var basah = t.Mtotal - m.Mcetakan;
      if (!(basah > 0)) galat.push('Titik ' + t.nama + ': massa tanah basah + cetakan harus lebih besar dari massa cetakan.');
      if (!(t.W2 > t.W3)) galat.push('Titik ' + t.nama + ': W2 harus lebih besar dari W3 (cawan).');
      var g = basah / m.V, gd = g / (1 + k.w / 100);
      return Object.assign({}, t, k, { basah: basah, gamma: g, gammaD: gd, zav: m.Gs * gw / (1 + k.w / 100 * m.Gs) });
    });
    var orde = m.orde === 3 ? 3 : 2;
    if (titik.length < orde + 1) galat.push('Kurva orde ' + orde + ' membutuhkan minimal ' + (orde + 1) + ' titik data (disarankan 5 titik atau lebih).');
    if (galat.length) return { galat: galat };

    titik.sort(function (a, b) { return a.w - b.w; });
    var xs = titik.map(function (t) { return t.w; }), ys = titik.map(function (t) { return t.gammaD; });
    var kurva = D.regresiPolinomial(xs, ys, orde);
    var wmin = xs[0], wmaks = xs[xs.length - 1];
    // Cari puncak kurva di dalam rentang data: sampel rapat lalu perhalus dengan pencarian emas.
    var terbaik = wmin, n = 2000;
    for (var i = 0; i <= n; i++) {
      var w = wmin + (wmaks - wmin) * i / n;
      if (kurva.f(w) > kurva.f(terbaik)) terbaik = w;
    }
    var lo = Math.max(wmin, terbaik - (wmaks - wmin) / n), hi = Math.min(wmaks, terbaik + (wmaks - wmin) / n), r = (Math.sqrt(5) - 1) / 2;
    for (var j = 0; j < 60; j++) {
      var c = hi - r * (hi - lo), d = lo + r * (hi - lo);
      if (kurva.f(c) > kurva.f(d)) hi = d; else lo = c;
    }
    var wopt = (lo + hi) / 2, gdmaks = kurva.f(wopt);
    var tepi = (wopt - wmin) < 0.02 * (wmaks - wmin) || (wmaks - wopt) < 0.02 * (wmaks - wmin);
    if (tepi) peringatan.push('Puncak kurva berada di tepi rentang data. Titik data belum mengapit kadar air optimum; tambah titik di sisi ' + ((wopt - wmin) < (wmaks - wopt) ? 'kering' : 'basah') + '.');
    var terbanyak = titik.reduce(function (a, b) { return b.gammaD > a.gammaD ? b : a; });
    titik.forEach(function (t) {
      if (t.gammaD > t.zav * 1.001) peringatan.push('Titik ' + t.nama + ' berada di atas garis ZAV (derajat kejenuhan > 100%). Periksa Gs, isi cetakan, atau kadar air.');
    });
    if (kurva.r2 < 0.9) peringatan.push('Kurva orde ' + orde + ' kurang cocok dengan titik data (R² = ' + kurva.r2.toFixed(3).replace('.', ',') + ').');
    return { galat: [], peringatan: peringatan, titik: titik, orde: orde, kurva: kurva, wopt: wopt, gdmaks: gdmaks,
      titikTertinggi: terbanyak, gammaW: gw, tepi: tepi };
  }

  function sandCone(m) {
    var galat = [], peringatan = [];
    var k = m.kalibrasi;
    var gammaPasir = (k.W2 - k.W1) / (k.W3 - k.W1);
    if (!(k.W3 > k.W1 && k.W2 > k.W1)) galat.push('Kalibrasi pasir: W2 dan W3 harus lebih besar dari W1 (tabung kosong).');
    var titik = m.titik.map(function (t) {
      var kerucut = t.W6 - t.W7, total = t.W8 - t.W9, lubang = total - kerucut;
      if (!(kerucut > 0)) galat.push('Titik ' + t.nama + ': W6 harus lebih besar dari W7.');
      if (!(lubang > 0)) galat.push('Titik ' + t.nama + ': pasir dalam lubang harus positif, yaitu (W8 − W9) > (W6 − W7).');
      if (!(t.W11 > t.W10)) galat.push('Titik ' + t.nama + ': W11 harus lebih besar dari W10.');
      if (!(t.W14 > t.W12)) galat.push('Titik ' + t.nama + ': W14 harus lebih besar dari W12.');
      var w = (t.W13 - t.W14) / (t.W14 - t.W12);
      var Wt = t.W11 - t.W10, V = lubang / gammaPasir, Wd = Wt / (1 + w);
      return Object.assign({}, t, { kerucut: kerucut, total: total, lubang: lubang, V: V, Wt: Wt, w: w * 100, Wd: Wd,
        gamma: Wt / V, gammaD: Wd / V });
    });
    if (!titik.length) galat.push('Isi data minimal satu titik uji.');
    if (galat.length) return { galat: galat };
    var gd = D.rata(titik.map(function (t) { return t.gammaD; }));
    var hasil = { galat: [], peringatan: peringatan, gammaPasir: gammaPasir, titik: titik, gammaD: gd,
      w: D.rata(titik.map(function (t) { return t.w; })) };
    if (m.gammaLab > 0) {
      titik.forEach(function (t) { t.D = t.gammaD / m.gammaLab * 100; });
      hasil.D = gd / m.gammaLab * 100;
      if (m.syarat > 0) hasil.memenuhi = hasil.D >= m.syarat;
    } else {
      peringatan.push('Isi γd maks laboratorium (dari uji pemadatan) untuk menghitung derajat kepadatan.');
    }
    if (gammaPasir < 1.2 || gammaPasir > 1.8) peringatan.push('Berat isi pasir uji di luar kisaran umum pasir kalibrasi. Periksa data kalibrasi.');
    return hasil;
  }

  var api = { pemadatan: pemadatan, sandCone: sandCone };
  if (node) module.exports = api;
  else root.HitungKepadatan = api;
})(this);
