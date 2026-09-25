/*
 * Uji konsolidasi satu dimensi di laboratorium (SNI 2812:2011).
 *
 * Tinggi butiran padat  Hs = Ws / (Gs ρw A);  e0 = H0 / Hs − 1.
 * Tiap tahap beban: ΔH = (bacaan akhir − bacaan awal) × satuan arloji;  H = H0 − ΔH;  e = H / Hs − 1.
 * Indeks pemampatan Cc = −Δe / Δlog p pada cabang pembebanan (dua tahap tertinggi atau interval tercuram);
 * indeks pengembangan Cs dari beban maksimum ke bacaan terakhir pelepasan beban.
 * mv = Δe / [(1 + e_awal) Δp];  k = cv mv γw.
 * Koefisien konsolidasi (metode akar waktu Taylor): garis lurus awal pada kurva pemampatan terhadap √t
 *   (titik dengan derajat konsolidasi ≤ 60%),
 * garis kedua dengan absis 1,15 kali; perpotongannya dengan kurva memberi t90.
 *   cv = 0,848 Hdr² / t90,  Hdr = setengah tebal rata-rata tahap itu (drainase dua arah) atau tebal penuh (satu arah).
 * Korelasi pembanding Cc = 0,009 (LL − 10) untuk lempung terkonsolidasi normal (Terzaghi & Peck, 1967).
 */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./hitung-dasar.js') : root.HitungDasar;
  var DETIK_PER_TAHUN = 365.25 * 24 * 3600;

  // Metode Taylor. titik: [{ t (menit), s (pemampatan, makin besar makin mampat) }].
  // Garis lurus awal diperkirakan dari titik-titik pertama, lalu diperbaiki berulang memakai titik dengan
  // derajat konsolidasi ≤ 60% (menurut teori Terzaghi, s terhadap √t lurus sampai U ≈ 60%).
  function taylor(titik) {
    var p = titik.filter(function (x) { return x.t > 0 && isFinite(x.s); }).sort(function (a, b) { return a.t - b.t; })
      .map(function (x) { return { t: x.t, x: Math.sqrt(x.t), s: x.s }; });
    if (p.length < 5) return null;
    function garisDari(q) { return D.regresiLinier(q.map(function (z) { return z.x; }), q.map(function (z) { return z.s; })); }
    function potong(g) {
      if (!(g.b > 0)) return null;
      var b2 = g.b / 1.15, sel = p.map(function (q) { return q.s - (g.a + b2 * q.x); }), j = -1;
      // Perpotongan: titik pertama yang sejak itu selalu di bawah garis kedua.
      for (var i = p.length - 1; i >= 1; i--) {
        if (sel[i] < 0 && sel[i - 1] >= 0) { j = i; break; }
        if (sel[i] >= 0) break;
      }
      if (j < 0) return null;
      var x90 = p[j - 1].x + sel[j - 1] * (p[j].x - p[j - 1].x) / (sel[j - 1] - sel[j]);
      var s90 = g.a + b2 * x90;
      return { x90: x90, t90: x90 * x90, s0: g.a, s90: s90, s100: g.a + (s90 - g.a) / 0.9 };
    }
    var k = 3, garis = garisDari(p.slice(0, 3));
    for (var n = 4; n <= p.length - 2; n++) {
      var g = garisDari(p.slice(0, n));
      if (g.r2 < 0.998) break;
      garis = g; k = n;
    }
    var hasil = potong(garis);
    for (var ulang = 0; hasil && ulang < 8; ulang++) {
      var batas = hasil.s0 + 0.6 * (hasil.s100 - hasil.s0);
      var pilih = p.filter(function (q) { return q.s <= batas; });
      if (pilih.length < 3) break;
      var gBaru = garisDari(pilih), hBaru = potong(gBaru);
      if (!hBaru) break;
      var stabil = Math.abs(hBaru.t90 - hasil.t90) < 1e-6 * hasil.t90;
      garis = gBaru; hasil = hBaru; k = pilih.length;
      if (stabil) break;
    }
    if (!hasil) return garis.b > 0 ? { garis: garis, k: k, titik: p, t90: null } : null;
    return Object.assign({ garis: garis, k: k, titik: p }, hasil);
  }

  function hitung(m) {
    var galat = [], peringatan = [];
    if (!(m.Gs > 1.5)) galat.push('Isi berat spesifik Gs.');
    if (!(m.H0 > 0 && m.diameter > 0)) galat.push('Isi tinggi dan diameter cincin.');
    if (!(m.Ws > 0)) galat.push('Isi berat tanah kering.');
    if (!(m.satuan > 0)) galat.push('Isi satuan arloji.');
    if (!isFinite(m.arloji0)) galat.push('Isi bacaan arloji awal sebelum pembebanan.');
    if (m.tahap.length < 2) galat.push('Isi minimal dua tahap beban.');
    if (galat.length) return { galat: galat };

    var arah = m.arah === 'turun' ? -1 : 1;
    var A = Math.PI * m.diameter * m.diameter / 4, V = A * m.H0, Hs = m.Ws / (m.Gs * A), e0 = m.H0 / Hs - 1;
    var awal = { A: A, V: V, Hs: Hs, e0: e0 };
    if (m.Ww > 0) {
      awal.w = (m.Ww - m.Ws) / m.Ws * 100;
      awal.gamma = m.Ww / V;
      awal.Sr = awal.w / 100 * m.Gs / e0 * 100;
      if (awal.Sr > 105) peringatan.push('Derajat kejenuhan awal lebih dari 100%. Periksa berat tanah, Gs, atau ukuran cincin.');
    }
    awal.gammaD = m.Ws / V;

    var tahap = m.tahap.map(function (t, i) {
      var kolom = m.bacaan.map(function (b) { return { t: b.t, d: b.nilai[i] }; }).filter(function (b) { return b.d !== null && b.d !== undefined; });
      var akhir = t.akhir !== null && t.akhir !== undefined ? t.akhir : (kolom.length ? kolom[kolom.length - 1].d : null);
      if (akhir === null) galat.push('Tahap ' + t.nama + ': isi bacaan arloji akhir atau bacaan waktu.');
      if (!(t.p > 0)) galat.push('Tahap ' + t.nama + ': tekanan harus lebih dari 0.');
      return { nama: t.nama, p: t.p, akhir: akhir, t90manual: t.t90 > 0 ? t.t90 : null, kolom: kolom };
    });
    if (galat.length) return { galat: galat };

    var Hsebelum = m.H0, eSebelum = e0, pSebelum = 0, dSebelum = m.arloji0, iMaks = 0;
    tahap.forEach(function (t, i) {
      t.dH = arah * (t.akhir - m.arloji0) * m.satuan / 10; // cm
      t.H = m.H0 - t.dH;
      t.e = t.H / Hs - 1;
      t.Hawal = Hsebelum; t.eAwal = eSebelum; t.pAwal = pSebelum; t.dAwal = dSebelum;
      t.Havg = (Hsebelum + t.H) / 2;
      t.Hdr = m.drainase === 'satu' ? t.Havg : t.Havg / 2;
      if (t.p > tahap[iMaks].p) iMaks = i;
      Hsebelum = t.H; eSebelum = t.e; pSebelum = t.p; dSebelum = t.akhir;
    });
    tahap.forEach(function (t, i) {
      t.muat = i <= iMaks;
      if (t.muat && t.p <= t.pAwal) peringatan.push('Tahap ' + t.nama + ': tekanan tidak naik dari tahap sebelumnya. Urutkan tahap pembebanan dari kecil ke besar.');
      if (!t.muat && t.p >= t.pAwal) peringatan.push('Tahap ' + t.nama + ': tekanan pelepasan beban seharusnya turun.');
      if (t.muat) {
        t.mv = (t.eAwal - t.e) / ((1 + t.eAwal) * (t.p - t.pAwal)); // cm²/kg
        if (t.pAwal > 0) t.Cc = (t.eAwal - t.e) / (Math.log10(t.p) - Math.log10(t.pAwal));
        if (t.e > t.eAwal + 1e-9) peringatan.push('Tahap ' + t.nama + ': angka pori naik saat beban ditambah. Periksa bacaan arloji atau arahnya.');
      } else if (t.pAwal > 0) {
        t.Cs = (t.e - t.eAwal) / (Math.log10(t.pAwal) - Math.log10(t.p));
      }
      // cv dari bacaan waktu tahap pembebanan
      if (t.muat) {
        var tay = t.kolom.length ? taylor(t.kolom.map(function (b) { return { t: b.t, s: arah * b.d * m.satuan }; })) : null;
        t.taylor = tay;
        var t90 = t.t90manual || (tay ? tay.t90 : null);
        if (t.t90manual) t.caraT90 = 'manual';
        else if (tay && tay.t90) t.caraT90 = 'Taylor';
        if (t90 > 0) {
          t.t90 = t90;
          t.cv = 0.848 * t.Hdr * t.Hdr / (t90 * 60); // cm²/s
          t.cvTahun = t.cv * 1e-4 * DETIK_PER_TAHUN; // m²/tahun
          if (t.mv > 0) t.k = t.cv * t.mv * 0.001; // cm/s (γw = 0,001 kg/cm³)
        } else if (t.kolom.length) {
          peringatan.push('Tahap ' + t.nama + ': t90 tidak ditemukan dari kurva √t (pemampatan belum mencapai 90% atau bacaan terlalu sedikit). Isi t90 manual bila perlu.');
        }
      }
    });

    var muat = tahap.filter(function (t) { return t.muat && t.Cc !== undefined; });
    var hasil = { galat: [], peringatan: peringatan, awal: awal, tahap: tahap, iMaks: iMaks };
    if (muat.length) {
      var pilih = m.caraCc === 'maks' ? muat.reduce(function (a, t) { return t.Cc > a.Cc ? t : a; }) : muat[muat.length - 1];
      hasil.Cc = pilih.Cc; hasil.tahapCc = pilih;
    }
    var lepas = tahap.slice(iMaks + 1);
    if (lepas.length) {
      var ujung = lepas[lepas.length - 1], puncak = tahap[iMaks];
      hasil.Cs = (ujung.e - puncak.e) / (Math.log10(puncak.p) - Math.log10(ujung.p));
      hasil.tahapCs = [puncak, ujung];
    }
    if (m.LL > 0) hasil.CcKorelasi = 0.009 * (m.LL - 10);
    var cvs = tahap.filter(function (t) { return t.cv; });
    if (cvs.length) hasil.cvRata = D.rata(cvs.map(function (t) { return t.cv; }));
    return hasil;
  }

  var api = { hitung: hitung, taylor: taylor };
  if (node) module.exports = api;
  else root.HitungKonsolidasiLab = api;
})(this);
