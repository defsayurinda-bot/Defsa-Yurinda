/*
 * Analisis saringan (SNI 3423:2008) dan besaran kurva gradasi.
 *
 * % tertahan kumulatif = Σ berat tertahan / berat kering total × 100
 * % lolos = 100 − % tertahan kumulatif
 * D10, D30, D60: interpolasi linier % lolos terhadap log ukuran butir.
 * Cu = D60 / D10,  Cc = D30² / (D10 · D60)
 * Batas fraksi (SNI 6371:2015 / ASTM D2487): kerikil > 4,75 mm; pasir 4,75–0,075 mm; halus < 0,075 mm.
 */
(function (root) {
  'use strict';

  // Ukuran lubang saringan standar (mm), ASTM E11.
  var SARINGAN = [
    ['3"', 75], ['2"', 50.8], ['1½"', 38.1], ['1"', 25.4], ['¾"', 19.0], ['½"', 12.5], ['⅜"', 9.5],
    ['No. 4', 4.75], ['No. 8', 2.36], ['No. 10', 2.0], ['No. 16', 1.18], ['No. 20', 0.85], ['No. 30', 0.6],
    ['No. 40', 0.425], ['No. 50', 0.3], ['No. 60', 0.25], ['No. 100', 0.15], ['No. 140', 0.106], ['No. 200', 0.075]
  ].map(function (s) { return { nama: s[0], mm: s[1] }; });

  function ukuran(nama) {
    var s = SARINGAN.filter(function (x) { return x.nama === nama; })[0];
    return s ? s.mm : NaN;
  }

  // Ukuran butir untuk % lolos p, dari titik-titik (mm, % lolos) yang diurutkan dari besar ke kecil.
  function diameter(titik, p) {
    for (var i = 0; i < titik.length - 1; i++) {
      var a = titik[i], b = titik[i + 1];
      if ((a.lolos >= p && b.lolos <= p) && a.lolos !== b.lolos) {
        var la = Math.log10(a.mm), lb = Math.log10(b.mm);
        return Math.pow(10, lb + (p - b.lolos) * (la - lb) / (a.lolos - b.lolos));
      }
    }
    return null; // di luar rentang data
  }

  // % lolos pada ukuran d (mm), interpolasi pada log d.
  function lolosPada(titik, d) {
    for (var i = 0; i < titik.length; i++) if (Math.abs(titik[i].mm - d) < 1e-9) return titik[i].lolos;
    for (var j = 0; j < titik.length - 1; j++) {
      var a = titik[j], b = titik[j + 1];
      if (a.mm > d && b.mm < d) {
        return b.lolos + (Math.log10(d) - Math.log10(b.mm)) * (a.lolos - b.lolos) / (Math.log10(a.mm) - Math.log10(b.mm));
      }
    }
    return null;
  }

  function hitung(m) {
    var galat = [], peringatan = [];
    if (!(m.beratTotal > 0)) galat.push('Berat kering total harus lebih dari 0.');
    var ayakan = m.ayakan.filter(function (a) { return isFinite(a.tertahan); })
      .map(function (a) { return Object.assign({}, a, { mm: ukuran(a.nama) }); })
      .sort(function (a, b) { return b.mm - a.mm; });
    ayakan.forEach(function (a) {
      if (!(a.tertahan >= 0)) galat.push('Berat tertahan saringan ' + a.nama + ' tidak boleh negatif.');
      if (!isFinite(a.mm)) galat.push('Ukuran saringan ' + a.nama + ' tidak dikenal.');
    });
    if (ayakan.length < 2) galat.push('Isi berat tertahan minimal dua saringan.');
    if (galat.length) return { galat: galat };

    var kum = 0;
    ayakan.forEach(function (a) {
      kum += a.tertahan;
      a.kumulatif = kum;
      a.persenTertahan = kum / m.beratTotal * 100;
      a.lolos = 100 - a.persenTertahan;
    });
    var pan = m.pan >= 0 ? m.pan : 0;
    var jumlah = kum + pan;
    var hilang = (m.beratTotal - jumlah) / m.beratTotal * 100;
    if (Math.abs(hilang) > 1) {
      peringatan.push('Jumlah berat tertahan termasuk pan berbeda ' + Math.abs(hilang).toFixed(2).replace('.', ',') +
        '% dari berat kering total. Periksa penimbangan (selisih yang wajar biasanya di bawah 1%).');
    }
    if (ayakan.some(function (a) { return a.lolos < -1e-9; })) {
      galat.push('Jumlah berat tertahan melebihi berat kering total.');
      return { galat: galat };
    }

    // Titik kurva: saringan terbesar dianggap 100% lolos bila belum ada titik di atasnya.
    var titik = ayakan.map(function (a) { return { mm: a.mm, lolos: a.lolos }; });
    var atas = SARINGAN.filter(function (s) { return s.mm > ayakan[0].mm; }).pop();
    if (atas && ayakan[0].tertahan > 0) titik.unshift({ mm: atas.mm, lolos: 100 });

    var D10 = diameter(titik, 10), D30 = diameter(titik, 30), D60 = diameter(titik, 60);
    var hasil = { galat: [], peringatan: peringatan, ayakan: ayakan, titik: titik, pan: pan, jumlah: jumlah, hilang: hilang,
      D10: D10, D30: D30, D60: D60 };
    if (D10 && D60) hasil.Cu = D60 / D10;
    if (D10 && D30 && D60) hasil.Cc = D30 * D30 / (D10 * D60);
    if (!D10) peringatan.push('D10 tidak dapat ditentukan dari data saringan (% lolos saringan terkecil di atas 10%). Butir halus perlu dianalisis dengan hidrometer.');

    var l475 = lolosPada(titik, 4.75), l0075 = lolosPada(titik, 0.075);
    if (l475 !== null && l0075 !== null) {
      hasil.fraksi = { kerikil: 100 - l475, pasir: l475 - l0075, halus: l0075 };
    } else {
      peringatan.push('Fraksi kerikil/pasir/halus butuh data saringan No. 4 (4,75 mm) dan No. 200 (0,075 mm).');
    }
    return hasil;
  }

  var api = { SARINGAN: SARINGAN, ukuran: ukuran, diameter: diameter, lolosPada: lolosPada, hitung: hitung };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HitungSaringan = api;
})(this);
