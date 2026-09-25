/* Definisi alat: analisis hidrometer 152H dan kurva gradasi gabungan dengan saringan. */
(function () {
  'use strict';

  var H = window.HitungHidrometer, HS = window.HitungSaringan, f = Umum.f;
  var WAKTU = [0.5, 1, 2, 4, 8, 15, 30, 60, 240, 480, 1440, 2880];

  function formatMm(v) { return f(v, v >= 1 ? 2 : v >= 0.01 ? 3 : 4); }

  function grafik(r) {
    var dmin = Math.pow(10, Math.floor(Math.log10(Math.min.apply(null, r.titik.map(function (t) { return t.mm; })))));
    var dmaks = Math.max(10, Math.pow(10, Math.ceil(Math.log10(r.titik[0].mm))));
    var saringan = r.titik.filter(function (t) { return t.asal === 'saringan'; }), hidro = r.titik.filter(function (t) { return t.asal === 'hidrometer'; });
    var tanda = [];
    [['D₁₀', r.D10, 10], ['D₃₀', r.D30, 30], ['D₆₀', r.D60, 60]].forEach(function (d) {
      if (d[1]) tanda.push({ x: d[1], y: d[2], teks: d[0] + ' = ' + formatMm(d[1]) + ' mm', posisi: d[1] < Math.sqrt(dmin * dmaks) ? 'kiri' : 'kanan' }); // sumbu terbalik: butir kecil di kanan
    });
    return Grafik.plot({ id: 'gradasi-gabungan', judul: 'Kurva gradasi gabungan', x: { min: dmin, max: dmaks, log: true, balik: true, label: 'Ukuran butir (mm, skala log)' },
      y: { min: 0, max: 100, label: 'Persen lolos (%)', tick: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
      vertikal: [{ x: 4.75, teks: 'No. 4' }, { x: 0.075, teks: 'No. 200' }, { x: r.batasLempung, teks: String(r.batasLempung).replace('.', ',') + ' mm' }],
      seri: [{ titik: r.titik.map(function (t) { return [t.mm, t.lolos]; }), warna: 'teks', tebal: 1.8 },
        { titik: saringan.map(function (t) { return [t.mm, t.lolos]; }), garis: false, penanda: true, warna: 'aksen', label: 'Saringan' },
        { titik: hidro.map(function (t) { return [t.mm, t.lolos]; }), garis: false, penanda: true, warna: 'biru', label: 'Hidrometer' }],
      tanda: tanda });
  }

  Praktikum.pasang({
    id: 'hidrometer', judulEkspor: 'Analisa hidrometer (SNI 3423:2008)',
    parameter: [
      { id: 'W', label: 'Massa kering contoh hidrometer, W', satuan: 'gram', bantuan: 'Contoh yang didispersikan, biasanya bagian lolos No. 10.' },
      { id: 'Gs', label: 'Berat spesifik, G<sub>s</sub>', dariAlat: { alat: 'berat-spesifik', nama: 'berat spesifik', ambil: function (h) { return h.G; }, d: 3 } },
      { id: 'a', label: 'Faktor koreksi berat jenis, a', bantuan: 'Kosongkan untuk memakai a = 1,65 G<sub>s</sub> / [(G<sub>s</sub> − 1) 2,65].' },
      { id: 'F10', label: 'Lolos No. 10 seluruh contoh, F<sub>10</sub>', satuan: '%', bantuan: '100 bila seluruh contoh lolos No. 10. Dipakai untuk mengubah persen ke seluruh contoh.',
        dariAlat: { alat: 'saringan', nama: 'analisa saringan', ambil: function (h) { return h.P10; }, d: 2 } },
      { id: 'P4', label: 'Lolos No. 4 seluruh contoh', satuan: '%', bantuan: 'Hanya dipakai bila F<sub>10</sub> < 100%.',
        dariAlat: { alat: 'saringan', nama: 'analisa saringan', ambil: function (h) { return h.P4; }, d: 2 } },
      { id: 'Cm', label: 'Koreksi meniskus, C<sub>m</sub>', bantuan: 'Ditambahkan ke bacaan untuk menghitung L. Isi 0 bila tidak dipakai.' },
      { id: 'Cd', label: 'Koreksi nol/dispersan, C<sub>d</sub>', bantuan: 'Dikurangkan dari bacaan. Isi 0 bila koreksi suhu k sudah mencakupnya.' },
      { id: 'batasLempung', label: 'Batas lanau–lempung', pilihan: [['0.002', '0,002 mm'], ['0.005', '0,005 mm (ASTM D422)']] }],
    tabel: [
      { id: 'bacaan', jenis: 'daftar', judul: 'Bacaan hidrometer', namaPendek: 'Bacaan hidrometer', maks: 30,
        keterangan: 'Waktu dalam menit sejak pengocokan. k = koreksi suhu seperti pada form lab. L dan K boleh diisi dari tabel ASTM; bila kosong dihitung otomatis.',
        awal: WAKTU.map(function (t) { return { t: t }; }),
        kolom: [{ id: 't', label: 'Waktu, t', satuan: 'menit', kunci: true }, { id: 'R', label: 'Bacaan, R' }, { id: 'T', label: 'Suhu, T', satuan: '°C' },
          { id: 'k', label: 'Koreksi suhu, k', opsional: true }, { id: 'L', label: 'L manual', satuan: 'cm', opsional: true }, { id: 'K', label: 'K manual', opsional: true }] },
      { id: 'ayakan', jenis: 'baris', judul: 'Saringan setelah pengujian (contoh hidrometer)', namaBaris: 'Saringan',
        pilihanBaris: HS.SARINGAN.map(function (s) { return s.nama; }), barisAwal: ['No. 4', 'No. 10', 'No. 20', 'No. 40', 'No. 60', 'No. 140', 'No. 200'],
        infoBaris: function (n) { return '(' + formatMm(HS.ukuran(n)) + ' mm)'; },
        kolomNilai: { id: 'tertahan', label: 'Berat tertahan (gram)' },
        keterangan: 'Contoh dicuci di atas No. 200 setelah pembacaan terakhir, dikeringkan, lalu disaring. Boleh dikosongkan.' }],
    contoh: { param: { W: 50, Gs: 2.68, a: '', F10: 100, P4: '', Cm: 0, Cd: 0, batasLempung: '0.002' }, tabel: {
      bacaan: [[0.5, 36, 27, 1.5], [1, 34, 27, 1.5], [2, 31.5, 27, 1.5], [4, 29, 27, 1.5], [8, 26.5, 27.5, 1.6], [15, 24, 27.5, 1.6], [30, 21.5, 28, 1.8],
        [60, 19, 28, 1.8], [240, 14.5, 28.5, 1.9], [480, 12.5, 28, 1.8], [1440, 9.5, 27, 1.5], [2880, 8, 27, 1.5]]
        .map(function (b) { return { t: b[0], R: b[1], T: b[2], k: b[3] }; }),
      ayakan: [['No. 4', 0], ['No. 10', 0], ['No. 20', 0.8], ['No. 40', 1.9], ['No. 60', 2.1], ['No. 140', 3.6], ['No. 200', 2.2]]
        .map(function (b) { return { nama: b[0], nilai: b[1] }; }) } },
    kosong: { param: { W: '', Gs: '', a: '', F10: 100, P4: '', Cm: 0, Cd: 0, batasLempung: '0.002' } },
    hitung: function (m) {
      var p = m.param;
      return H.hitung({ W: p.W, Gs: p.Gs, a: p.a, F10: p.F10, P4: p.P4, Cm: p.Cm, Cd: p.Cd, batasLempung: +p.batasLempung,
        bacaan: m.tabel.bacaan, ayakan: m.tabel.ayakan.map(function (b) { return { nama: b.nama, tertahan: b.nilai }; }) });
    },
    hasil: function (m, r) { return { P4: r.P4, P10: r.P10, P40: r.P40, P200: r.P200, D10: r.D10, D30: r.D30, D60: r.D60, fraksi: r.fraksi }; },
    tampil: function (m, r, U) {
      var p = m.param, h = '', fr = r.fraksi, kartu = [];
      if (fr) {
        kartu.push(U.kartu('Kerikil', f(fr.kerikil, 2) + ' <small>%</small>', '> 4,75 mm'), U.kartu('Pasir', f(fr.pasir, 2) + ' <small>%</small>', '4,75 – 0,075 mm'));
        kartu.push(U.kartu('Lanau', fr.lanau !== null ? f(fr.lanau, 2) + ' <small>%</small>' : '–', '0,075 – ' + String(r.batasLempung).replace('.', ',') + ' mm'),
          U.kartu('Lempung', fr.lempung !== null ? f(fr.lempung, 2) + ' <small>%</small>' : '–', '< ' + String(r.batasLempung).replace('.', ',') + ' mm'));
      }
      h += U.ringkasan(kartu.concat([U.kartu('Koefisien gradasi', r.Cu ? 'C<sub>u</sub> ' + f(r.Cu, 2) : '–', r.Cc ? 'C<sub>c</sub> = ' + f(r.Cc, 2) : 'D<sub>10</sub> belum terbaca')]));
      h += U.grafik(grafik(r), 'Kurva gradasi gabungan saringan dan hidrometer. Persen lolos terhadap seluruh contoh.');
      var b = r.bacaan;
      h += '<h3>Tabel hasil hidrometer</h3>' + U.tabel([{ teks: 't (menit)' }, { teks: 'R' }, { teks: 'T (°C)' }, 'R<sub>c</sub> = R + k − C<sub>d</sub>', 'L (cm)', 'K', 'D (mm)', 'P (%)', 'P′ (%)'],
        b.map(function (x) {
          return [f(x.t, x.t < 1 ? 1 : 0), f(x.R, 1), f(x.T, 1), f(x.Rc, 2), f(x.L, 2) + (x.Lmanual ? '*' : ''), f(x.K, 5) + (x.Kmanual ? '*' : ''), formatMm(x.D), f(x.P, 2), f(x.Ptotal, 2)];
        }), null, { angkaMulai: 0 });
      h += '<p class="kecil redup">P = persen lolos terhadap contoh hidrometer; P′ = terhadap seluruh contoh (× F<sub>10</sub>/100). Tanda * = nilai diisi manual.</p>';
      if (r.ayakan.length) {
        h += '<h3>Tabel saringan contoh hidrometer</h3>' + U.tabel([{ teks: 'Saringan' }, { teks: 'Ukuran (mm)', angka: true }, { teks: 'Tertahan (gram)', angka: true }, 'Kumulatif (gram)', 'Lolos (%)', 'Lolos seluruh contoh (%)'],
          r.ayakan.map(function (a) { return [a.nama, formatMm(a.mm), f(a.tertahan, 3), f(a.kumulatif, 3), f(a.lolos, 2), f(a.lolosTotal, 2)]; }));
      }
      var x = b[0];
      h += '<h3>Langkah hitungan (bacaan menit ke-' + f(x.t, x.t < 1 ? 1 : 0) + ')</h3>';
      h += U.langkah('Faktor koreksi berat jenis', r.aManual ? '<p>a diisi manual: a = ' + f(r.a, 3) + ' (rumus memberi ' + f(r.aRumus, 3) + ').</p>' :
        U.rumus('a = \\dfrac{1{,}65\\,G_s}{(G_s - 1)\\,2{,}65} = \\dfrac{1{,}65\\times' + U.t(p.Gs, 3) + '}{(' + U.t(p.Gs, 3) + ' - 1)\\times 2{,}65} = ' + U.t(r.a, 4) + ' \\qquad (1)'));
      h += U.langkah('Kedalaman efektif', x.Lmanual ? '<p>L diisi manual: ' + f(x.L, 2) + ' cm.</p>' :
        U.rumus('L = 16{,}29 - 0{,}164\\,(R + C_m) = 16{,}29 - 0{,}164\\times' + U.t(x.RL, 2) + ' = ' + U.t(x.L, 3) + '\\ \\text{cm} \\qquad (2)') +
        '<p class="ket">Rumus kedalaman efektif hidrometer 152H dengan ukuran standar (ASTM D422 Tabel 2).</p>');
      h += U.langkah('Konstanta Stokes dan diameter butir', (x.Kmanual ? '<p>K diisi manual: ' + f(x.K, 5) + '.</p>' :
        U.rumus('\\eta = 2{,}414\\times10^{-5}\\times 10^{\\,247{,}8/(' + U.t(x.T, 1) + ' + 273{,}15 - 140)} = ' + U.t(x.eta * 1000, 4) + '\\ \\text{mPa}\\cdot\\text{s} \\qquad (3)') +
        U.rumus('K = \\sqrt{\\dfrac{30\\,\\eta}{980\\,(G_s - G_1)}} = ' + U.t(x.K, 5) + ' \\qquad (4)') +
        '<p class="ket">η dalam poise (1 mPa·s = 0,01 poise), G<sub>1</sub> = berat jenis air pada T (Tanaka dkk., 2001).</p>') +
        U.rumus('D = K\\sqrt{\\dfrac{L}{t}} = ' + U.t(x.K, 5) + '\\sqrt{\\dfrac{' + U.t(x.L, 3) + '}{' + U.t(x.t, x.t < 1 ? 1 : 0) + '}} = ' + U.t(x.D, 4) + '\\ \\text{mm} \\qquad (5)') +
        '<p class="ket">t dalam <strong>menit</strong>, sesuai satuan pada tabel K ASTM D422.</p>');
      h += U.langkah('Persen lolos', U.rumus('P = \\dfrac{a\\,R_c}{W}\\times 100\\% = \\dfrac{' + U.t(r.a, 4) + '\\times' + U.t(x.Rc, 2) + '}{' + U.t(p.W, 2) + '}\\times 100\\% = ' + U.t(x.P, 2) + '\\% \\qquad (6)') +
        U.rumus('P\' = P\\times\\dfrac{F_{10}}{100} = ' + U.t(x.P, 2) + '\\times\\dfrac{' + U.t(r.F10, 2) + '}{100} = ' + U.t(x.Ptotal, 2) + '\\% \\qquad (7)') +
        '<p class="ket">R<sub>c</sub> = R + k − C<sub>d</sub> = ' + f(x.R, 1) + ' + ' + f(x.k, 2) + ' − ' + f(r.Cd, 2) + ' = ' + f(x.Rc, 2) + '.</p>');
      return h;
    },
    ekspor: function (m, r) {
      var b = [['Massa contoh W', 'gram', m.param.W], ['Gs', '-', m.param.Gs], ['Faktor a', '-', r.a], ['F10', '%', r.F10], [],
        ['t (menit)', 'R', 'T (°C)', 'k', 'Rc', 'L (cm)', 'K', 'D (mm)', 'P (%)', 'P seluruh contoh (%)']];
      r.bacaan.forEach(function (x) { b.push([x.t, x.R, x.T, x.k, x.Rc, x.L, x.K, x.D, x.P, x.Ptotal]); });
      if (r.ayakan.length) {
        b.push([], ['Saringan', 'Ukuran (mm)', 'Tertahan (gram)', 'Kumulatif (gram)', 'Lolos (%)', 'Lolos seluruh contoh (%)']);
        r.ayakan.forEach(function (a) { b.push([a.nama, a.mm, a.tertahan, a.kumulatif, a.lolos, a.lolosTotal]); });
      }
      b.push([], ['D10', 'mm', r.D10 || ''], ['D30', 'mm', r.D30 || ''], ['D60', 'mm', r.D60 || ''], ['Cu', '-', r.Cu || ''], ['Cc', '-', r.Cc || '']);
      if (r.fraksi) b.push(['Kerikil', '%', r.fraksi.kerikil], ['Pasir', '%', r.fraksi.pasir], ['Lanau', '%', r.fraksi.lanau === null ? '' : r.fraksi.lanau], ['Lempung', '%', r.fraksi.lempung === null ? '' : r.fraksi.lempung]);
      return b;
    },
    sumber: ['Badan Standardisasi Nasional. SNI 3423:2008 <em>Cara uji analisis ukuran butir tanah</em>.',
      'ASTM D422-63 (2002). <em>Standard test method for particle-size analysis of soils</em>. Faktor a, kedalaman efektif 152H, dan rumus K. Standar ini ditarik ASTM pada 2016 dan diganti ASTM D7928; rumusnya belum dicocokkan dengan D7928 [BELUM TERVERIFIKASI].',
      'Tanaka, M., Girard, G., Davis, R., Peuto, A., &amp; Bignell, N. (2001). Recommended table for the density of water between 0 °C and 40 °C based on recent experimental reports. <em>Metrologia, 38</em>(4), 301–309.',
      'Viskositas air: persamaan tipe Vogel η = A·10<sup>B/(T−C)</sup> dengan A = 2,414 × 10⁻⁵ Pa·s, B = 247,8 K, C = 140 K; dicek terhadap nilai IAPWS (2008) pada 20 °C dan 25 °C.']
  });
})();
