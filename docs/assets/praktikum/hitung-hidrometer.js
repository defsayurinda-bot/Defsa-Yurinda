/*
 * Analisis hidrometer (SNI 3423:2008, mengacu ASTM D422) dengan hidrometer 152H, digabung dengan saringan.
 * ASTM D422 ditarik pada 2016 (pengganti D7928); rumus di bawah belum dicocokkan dengan D7928 [BELUM TERVERIFIKASI].
 *
 * Bacaan terkoreksi untuk persen lolos:  Rc = R + k − Cd
 *   R = bacaan hidrometer, k = koreksi suhu (seperti form lab), Cd = koreksi nol/dispersan (opsional).
 * Kedalaman efektif 152H (ASTM D422 Tabel 2):  L = 16,29 − 0,164 (R + Cm)   [cm], Cm = koreksi meniskus.
 * Faktor koreksi berat jenis (ASTM D422 Tabel 1):  a = 1,65 Gs / [(Gs − 1) 2,65]
 * Persen lolos terhadap contoh hidrometer:  P = a Rc / W × 100
 * Hukum Stokes:  D = K √(L / t),  t dalam menit, D dalam mm,
 *   K = √[30 η / (980 (Gs − G1))], η dalam poise, G1 = berat jenis air pada suhu uji.
 * Viskositas air (persamaan tipe Vogel):  η = 2,414 × 10⁻⁵ × 10^(247,8 / (T + 273,15 − 140))  Pa·s
 *   (1 Pa·s = 10 poise). Dicek terhadap nilai acuan IAPWS: 1,0016 mPa·s (20 °C), 0,8900 mPa·s (25 °C).
 * Terhadap seluruh contoh: P' = P × F10 / 100, F10 = persen lolos No. 10 seluruh contoh (100 bila semua lolos).
 */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var SF = node ? require('./hitung-sifat-fisik.js') : root.HitungSifatFisik;
  var HS = node ? require('./hitung-saringan.js') : root.HitungSaringan;

  function viskositasAir(T) { return 2.414e-5 * Math.pow(10, 247.8 / (T + 273.15 - 140)); } // Pa·s
  function faktorA(Gs) { return 1.65 * Gs / ((Gs - 1) * 2.65); }
  function kedalamanL(R) { return 16.29 - 0.164 * R; }
  function konstantaK(T, Gs) { return Math.sqrt(30 * viskositasAir(T) * 10 / (980 * (Gs - SF.massaJenisAir(T)))); }

  function hitung(m) {
    var galat = [], peringatan = [];
    if (!(m.W > 0)) galat.push('Isi massa kering contoh hidrometer, W.');
    if (!(m.Gs > 1.5 && m.Gs < 4)) galat.push('Isi berat spesifik Gs (biasanya 2,6–2,8).');
    var F10 = m.F10 > 0 ? m.F10 : 100;
    if (F10 > 100) galat.push('Persen lolos No. 10 seluruh contoh tidak boleh lebih dari 100%.');
    if (!m.bacaan.length) galat.push('Isi minimal satu bacaan hidrometer.');
    m.bacaan.forEach(function (b) {
      if (!(b.t > 0)) galat.push('Bacaan ' + b.no + ': waktu harus lebih dari 0.');
      if (!(b.T > 0 && b.T <= 40)) galat.push('Bacaan ' + b.no + ': suhu harus antara 0 dan 40 °C.');
    });
    if (galat.length) return { galat: galat };

    var aRumus = faktorA(m.Gs), a = m.a > 0 ? m.a : aRumus;
    var Cm = isFinite(m.Cm) ? m.Cm : 0, Cd = isFinite(m.Cd) ? m.Cd : 0;
    var bacaan = m.bacaan.slice().sort(function (x, y) { return x.t - y.t; }).map(function (b) {
      var k = isFinite(b.k) && b.k !== null ? b.k : 0;
      var Rc = b.R + k - Cd, RL = b.R + Cm;
      var L = b.L > 0 ? b.L : kedalamanL(RL);
      var K = b.K > 0 ? b.K : konstantaK(b.T, m.Gs);
      var D = K * Math.sqrt(L / b.t), P = a * Rc / m.W * 100;
      return Object.assign({}, b, { k: k, Rc: Rc, RL: RL, L: L, Lmanual: b.L > 0, K: K, Kmanual: b.K > 0, eta: viskositasAir(b.T), D: D, P: P, Ptotal: P * F10 / 100 });
    });
    bacaan.forEach(function (b) {
      if (b.P > 100.5) peringatan.push('Bacaan menit ke-' + String(b.t).replace('.', ',') + ' memberi persen lolos lebih dari 100%. Periksa W, faktor a, atau koreksi.');
      if (b.P < 0) peringatan.push('Bacaan menit ke-' + String(b.t).replace('.', ',') + ' memberi persen lolos negatif. Periksa koreksi nol atau koreksi suhu.');
    });

    // Saringan contoh hidrometer (dicuci setelah pengujian): persen lolos terhadap W, lalu terhadap seluruh contoh.
    var kum = 0, ayakan = m.ayakan.filter(function (x) { return isFinite(x.tertahan); })
      .map(function (x) { return Object.assign({}, x, { mm: HS.ukuran(x.nama) }); }).sort(function (x, y) { return y.mm - x.mm; });
    ayakan.forEach(function (x) {
      kum += x.tertahan;
      x.kumulatif = kum;
      x.lolos = 100 - kum / m.W * 100;
      x.lolosTotal = x.lolos * F10 / 100;
    });
    if (kum > m.W * 1.001) return { galat: ['Jumlah berat tertahan saringan melebihi massa contoh W.'] };

    var titik = [];
    if (F10 < 100) {
      if (m.P4 >= F10) titik.push({ mm: 4.75, lolos: m.P4, asal: 'saringan' });
      if (ayakan.some(function (x) { return x.mm > 2; })) peringatan.push('F10 < 100%: saringan di atas No. 10 pada contoh hidrometer tidak dipakai. Bagian kasar diambil dari analisa saringan seluruh contoh.');
      titik.push({ mm: 2, lolos: F10, asal: 'saringan' });
    }
    ayakan.forEach(function (x) { if (F10 >= 100 || x.mm < 2) titik.push({ mm: x.mm, lolos: x.lolosTotal, asal: 'saringan' }); });
    bacaan.forEach(function (b) { titik.push({ mm: b.D, lolos: b.Ptotal, asal: 'hidrometer' }); });
    titik.sort(function (x, y) { return y.mm - x.mm; });
    // Buang titik ganda pada ukuran yang sama.
    titik = titik.filter(function (x, i) { return i === 0 || Math.abs(x.mm - titik[i - 1].mm) > 1e-12; });
    if (titik.length && titik[0].asal === 'saringan' && titik[0].lolos < 100 - 1e-9 && F10 >= 100) {
      var atas = HS.SARINGAN.filter(function (s) { return s.mm > titik[0].mm; }).pop();
      if (atas) titik.unshift({ mm: atas.mm, lolos: 100, asal: 'saringan' });
    }
    var monoton = titik.every(function (x, i) { return i === 0 || x.lolos <= titik[i - 1].lolos + 0.5; });
    if (!monoton) peringatan.push('Kurva gabungan tidak turun terus di sekitar sambungan saringan–hidrometer. Periksa W, faktor a, koreksi, atau F10. Diameter karakteristik diambil dari perpotongan pertama.');

    var batas = m.batasLempung > 0 ? m.batasLempung : 0.002;
    function lolos(d) { return HS.lolosPada(titik, d); }
    var p475 = F10 >= 100 && titik[0].mm <= 4.75 ? 100 : lolos(4.75), p0075 = lolos(0.075), pLempung = lolos(batas);
    var fraksi = null;
    if (p475 !== null && p0075 !== null) {
      fraksi = { kerikil: 100 - p475, pasir: p475 - p0075, lanau: pLempung !== null ? p0075 - pLempung : null, lempung: pLempung, halus: p0075 };
      if (pLempung === null) peringatan.push('Bacaan hidrometer belum mencapai ' + String(batas).replace('.', ',') + ' mm, jadi fraksi lempung belum bisa dipisahkan dari lanau. Tambah bacaan waktu lebih lama.');
    } else if (F10 < 100 && !(m.P4 >= 0)) {
      peringatan.push('Isi persen lolos No. 4 seluruh contoh untuk memisahkan kerikil dari pasir.');
    } else if (p0075 === null) {
      peringatan.push('Isi berat tertahan saringan contoh hidrometer sampai No. 200 supaya pasir dan butir halus bisa dipisahkan.');
    }
    var D10 = HS.diameter(titik, 10), D30 = HS.diameter(titik, 30), D60 = HS.diameter(titik, 60);
    var hasil = { galat: [], peringatan: peringatan, a: a, aRumus: aRumus, aManual: m.a > 0, F10: F10, Cm: Cm, Cd: Cd, bacaan: bacaan, ayakan: ayakan,
      titik: titik, fraksi: fraksi, batasLempung: batas, D10: D10, D30: D30, D60: D60,
      P4: p475, P10: lolos(2), P40: lolos(0.425), P200: p0075 };
    if (D10 && D60) hasil.Cu = D60 / D10;
    if (D10 && D30 && D60) hasil.Cc = D30 * D30 / (D10 * D60);
    return hasil;
  }

  var api = { hitung: hitung, viskositasAir: viskositasAir, faktorA: faktorA, kedalamanL: kedalamanL, konstantaK: konstantaK };
  if (node) module.exports = api;
  else root.HitungHidrometer = api;
})(this);
