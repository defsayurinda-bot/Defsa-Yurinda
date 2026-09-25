/*
 * Hitungan daya dukung aksial tiang bor dari data N-SPT.
 * File ini hanya berisi hitungan (tanpa tampilan) supaya bisa diuji terpisah.
 *
 * Satuan internal: m, kN, kPa (= kN/m²).
 *
 * Metode:
 * 1. Reese & Wright (1977)
 *    - Ujung, tanah nonkohesif: qp = 7 N (t/m²) ≤ 400 t/m² (N ≤ 60)
 *    - Ujung, tanah kohesif:    qp = 9 cu
 *    - Selimut, nonkohesif:     fs = 0,32 N (t/m²), berlaku N < 53
 *    - Selimut, kohesif:        fs = α cu, α = 0,55
 * 2. Meyerhof (1976), sesuai Kementerian PUPR (2019)
 *    - Ujung: qp = 38 N̄ (Lb/d) ≤ 380 N̄ (kPa), N̄ = rata-rata N dari 8d di atas sampai 4d di bawah ujung
 *    - Selimut: fs = σr N / 50 (perpindahan besar) atau σr N / 100 (perpindahan kecil), σr = 100 kPa
 */
(function (root) {
  'use strict';

  var T_KE_KPA = 9.80665; // 1 t/m² = 9,80665 kPa
  var SIGMA_R = 100;      // tegangan referensi, kPa
  var ALPHA_RW = 0.55;    // faktor adhesi Reese & Wright
  var BATAS_N_SELIMUT_RW = 53;
  var BATAS_QP_RW_T = 400; // t/m²

  function luasUjung(d) { return Math.PI * d * d / 4; }
  function keliling(d) { return Math.PI * d; }

  // Lapisan yang memuat kedalaman z (atas ≤ z < bawah).
  function lapisanPada(lapisan, z) {
    for (var i = 0; i < lapisan.length; i++) {
      if (z >= lapisan[i].atas && z < lapisan[i].bawah) return i;
    }
    return -1;
  }

  // Potongan lapisan sepanjang tiang, dari muka tanah sampai ujung.
  function segmenSelimut(lapisan, L) {
    var hasil = [];
    lapisan.forEach(function (ly, i) {
      var atas = ly.atas, bawah = Math.min(ly.bawah, L);
      if (bawah > atas) hasil.push({ indeks: i, atas: atas, bawah: bawah, tebal: bawah - atas });
    });
    return hasil;
  }

  // Rata-rata N berbobot tebal pada rentang [z1, z2].
  function rataN(lapisan, z1, z2) {
    var jumlah = 0, tebal = 0;
    lapisan.forEach(function (ly) {
      var a = Math.max(ly.atas, z1), b = Math.min(ly.bawah, z2);
      if (b > a) { jumlah += ly.N * (b - a); tebal += b - a; }
    });
    return tebal > 0 ? jumlah / tebal : NaN;
  }

  function periksaMasukan(m) {
    var galat = [];
    if (!(m.d > 0)) galat.push('Diameter tiang harus lebih dari 0.');
    if (!(m.L > 0)) galat.push('Panjang tiang harus lebih dari 0.');
    if (!(m.SF > 0)) galat.push('Faktor keamanan harus lebih dari 0.');
    if (!m.lapisan.length) galat.push('Isi minimal satu lapisan tanah.');
    var atas = 0;
    m.lapisan.forEach(function (ly, i) {
      var no = i + 1;
      if (Math.abs(ly.atas - atas) > 1e-9) galat.push('Lapisan ' + no + ' harus dimulai tepat di bawah lapisan sebelumnya.');
      if (!(ly.bawah > ly.atas)) galat.push('Kedalaman bawah lapisan ' + no + ' harus lebih besar dari kedalaman atasnya.');
      if (!(ly.N >= 0)) galat.push('Nilai N lapisan ' + no + ' tidak valid.');
      if (ly.jenis === 'lempung' && !(ly.cu > 0)) galat.push('Lapisan ' + no + ' (lempung) memerlukan nilai cu.');
      atas = ly.bawah;
    });
    if (m.lapisan.length && atas < m.L + 4 * m.d - 1e-9) {
      galat.push('Data tanah harus mencapai minimal 4d di bawah ujung tiang (sampai ' +
        (m.L + 4 * m.d).toFixed(2).replace('.', ',') + ' m) untuk menghitung N rata-rata Meyerhof.');
    }
    return galat;
  }

  function reeseWright(m, geo) {
    var peringatan = [];
    var segmen = segmenSelimut(m.lapisan, m.L).map(function (s) {
      var ly = m.lapisan[s.indeks], fs, rumus;
      if (ly.jenis === 'lempung') {
        fs = ALPHA_RW * ly.cu;
        rumus = 'kohesif';
      } else {
        var N = ly.N;
        if (N > BATAS_N_SELIMUT_RW) {
          N = BATAS_N_SELIMUT_RW;
          peringatan.push('Lapisan ' + (s.indeks + 1) + ': N = ' + ly.N + ' melebihi batas 53 untuk rumus selimut; dipakai N = 53.');
        }
        fs = 0.32 * N * T_KE_KPA;
        rumus = 'nonkohesif';
      }
      return Object.assign({}, s, { jenis: ly.jenis, N: ly.N, cu: ly.cu, fs: fs, rumus: rumus, Qs: fs * geo.p * s.tebal });
    });
    var Qs = segmen.reduce(function (a, s) { return a + s.Qs; }, 0);

    var iUjung = lapisanPada(m.lapisan, m.L);
    var lyU = m.lapisan[iUjung], qp, ujung;
    if (lyU.jenis === 'lempung') {
      qp = 9 * lyU.cu;
      ujung = { rumus: 'kohesif', cu: lyU.cu };
    } else {
      var qpT = 7 * lyU.N, dibatasi = qpT > BATAS_QP_RW_T;
      if (dibatasi) qpT = BATAS_QP_RW_T;
      qp = qpT * T_KE_KPA;
      ujung = { rumus: 'nonkohesif', N: lyU.N, qpT: qpT, dibatasi: dibatasi };
    }
    return { segmen: segmen, Qs: Qs, lapisanUjung: iUjung, ujung: ujung, qp: qp, Qp: qp * geo.Ap, peringatan: peringatan };
  }

  function meyerhof(m, geo) {
    var peringatan = [];
    var pembagi = m.perpindahan === 'besar' ? 50 : 100;
    var segmen = segmenSelimut(m.lapisan, m.L).map(function (s) {
      var ly = m.lapisan[s.indeks];
      var fs = SIGMA_R * ly.N / pembagi;
      return Object.assign({}, s, { jenis: ly.jenis, N: ly.N, fs: fs, Qs: fs * geo.p * s.tebal });
    });
    var Qs = segmen.reduce(function (a, s) { return a + s.Qs; }, 0);
    if (m.lapisan.some(function (ly, i) { return ly.jenis === 'lempung' && ly.atas < m.L + 4 * m.d; })) {
      peringatan.push('Korelasi SPT Meyerhof dikembangkan untuk tanah granular. Hasil pada lapisan lempung hanya bersifat perkiraan.');
    }

    var z1 = Math.max(0, m.L - 8 * m.d), z2 = m.L + 4 * m.d;
    var Nrata = rataN(m.lapisan, z1, z2);
    var iUjung = lapisanPada(m.lapisan, m.L);
    var Lb = m.L - m.lapisan[iUjung].atas;
    var qpTanpaBatas = 38 * Nrata * (Lb / m.d);
    var qpBatas = 380 * Nrata;
    var qp = Math.min(qpTanpaBatas, qpBatas);
    return {
      segmen: segmen, Qs: Qs, pembagi: pembagi,
      zona: { atas: z1, bawah: z2 }, Nrata: Nrata, lapisanUjung: iUjung, Lb: Lb,
      qpTanpaBatas: qpTanpaBatas, qpBatas: qpBatas, dibatasi: qpTanpaBatas > qpBatas,
      qp: qp, Qp: qp * geo.Ap, peringatan: peringatan
    };
  }

  function hitung(m) {
    var galat = periksaMasukan(m);
    if (galat.length) return { galat: galat };
    var geo = { Ap: luasUjung(m.d), p: keliling(m.d) };
    var W = m.pakaiBerat ? m.gammaBeton * geo.Ap * m.L : 0;
    function tutup(r) {
      r.W = W;
      r.Qu = r.Qp + r.Qs - W;
      r.Qa = r.Qu / m.SF;
      return r;
    }
    return {
      galat: [],
      geo: geo,
      W: W,
      reeseWright: tutup(reeseWright(m, geo)),
      meyerhof: tutup(meyerhof(m, geo))
    };
  }

  var api = { hitung: hitung, rataN: rataN, T_KE_KPA: T_KE_KPA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TiangBor = api;
})(this);
