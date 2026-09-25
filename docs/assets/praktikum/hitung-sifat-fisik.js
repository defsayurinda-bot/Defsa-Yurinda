/*
 * Kadar air (SNI 1965:2008) dan berat spesifik dengan piknometer (SNI 1964:2008).
 *
 * Kadar air:  w = (W1 − W2) / (W2 − W3) × 100%
 *   W1 = cawan + tanah basah, W2 = cawan + tanah kering, W3 = cawan kosong.
 *
 * Berat spesifik:  G_T = (W2 − W1) / [(W4 − W1) − (W3 − W2)]
 *   W1 = piknometer, W2 = piknometer + tanah kering, W3 = piknometer + tanah + air,
 *   W4 = piknometer + air (penuh sampai tanda batas), pada suhu T.
 *   Dikoreksi ke suhu acuan: G = G_T × ρw(T) / ρw(T acuan).
 *
 * Massa jenis air ρw(T): Tanaka dkk. (2001), Metrologia 38(4), 301–309, berlaku 0–40 °C.
 */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./hitung-dasar.js') : root.HitungDasar;

  // Tanaka dkk. (2001), dalam g/cm³.
  function massaJenisAir(T) {
    var a1 = -3.983035, a2 = 301.797, a3 = 522528.9, a4 = 69.34881, a5 = 999.974950;
    return a5 * (1 - (T + a1) * (T + a1) * (T + a2) / (a3 * (T + a4))) / 1000;
  }

  function kadarAir(m) {
    var galat = [];
    var cawan = m.cawan.map(function (c) {
      var k = D.kadarAir(c.W1, c.W2, c.W3);
      if (!(c.W2 > c.W3)) galat.push('Cawan ' + c.nama + ': W2 (cawan + tanah kering) harus lebih besar dari W3 (cawan kosong).');
      if (!(c.W1 >= c.W2)) galat.push('Cawan ' + c.nama + ': W1 (cawan + tanah basah) tidak boleh lebih kecil dari W2.');
      return Object.assign({}, c, k);
    });
    if (!cawan.length) galat.push('Isi data minimal satu cawan.');
    if (galat.length) return { galat: galat };
    var nilai = cawan.map(function (c) { return c.w; });
    var peringatan = [];
    var rentang = Math.max.apply(null, nilai) - Math.min.apply(null, nilai);
    if (cawan.length > 1 && rentang > 0.1 * D.rata(nilai)) {
      peringatan.push('Selisih kadar air antarcawan lebih dari 10% nilai rata-rata. Periksa kembali penimbangan atau keseragaman contoh.');
    }
    return { galat: [], peringatan: peringatan, cawan: cawan, w: D.rata(nilai), rentang: rentang };
  }

  function beratSpesifik(m) {
    var galat = [];
    if (!(m.Tacuan >= 0 && m.Tacuan <= 40)) galat.push('Suhu acuan harus antara 0 dan 40 °C.');
    var rhoAcuan = massaJenisAir(m.Tacuan);
    var uji = m.uji.map(function (u) {
      var Ws = u.W2 - u.W1, pembagi = (u.W4 - u.W1) - (u.W3 - u.W2);
      if (!(Ws > 0)) galat.push('Piknometer ' + u.nama + ': W2 harus lebih besar dari W1.');
      if (!(pembagi > 0)) galat.push('Piknometer ' + u.nama + ': (W4 − W1) − (W3 − W2) harus positif. Periksa W3 dan W4.');
      if (!(u.T >= 0 && u.T <= 40)) galat.push('Piknometer ' + u.nama + ': suhu harus antara 0 dan 40 °C.');
      var rhoT = u.rhoT > 0 ? u.rhoT : massaJenisAir(u.T);
      var GT = Ws / pembagi;
      return Object.assign({}, u, { Ws: Ws, pembagi: pembagi, GT: GT, rhoT: rhoT, rhoManual: u.rhoT > 0, G: GT * rhoT / rhoAcuan });
    });
    if (!uji.length) galat.push('Isi data minimal satu piknometer.');
    if (galat.length) return { galat: galat };
    var nilai = uji.map(function (u) { return u.G; });
    var G = D.rata(nilai), peringatan = [];
    if (G < 2.5 || G > 2.9) peringatan.push('Gs di luar rentang umum tanah mineral (sekitar 2,6–2,8). Periksa data, kecuali contoh mengandung bahan organik.');
    var rentang = Math.max.apply(null, nilai) - Math.min.apply(null, nilai);
    if (uji.length > 1 && rentang > 0.05) peringatan.push('Selisih Gs antarpiknometer lebih dari 0,05. Periksa penimbangan dan pengeluaran udara.');
    return { galat: [], peringatan: peringatan, uji: uji, rhoAcuan: rhoAcuan, G: G, rentang: rentang };
  }

  var api = { massaJenisAir: massaJenisAir, kadarAir: kadarAir, beratSpesifik: beratSpesifik };
  if (node) module.exports = api;
  else root.HitungSifatFisik = api;
})(this);
