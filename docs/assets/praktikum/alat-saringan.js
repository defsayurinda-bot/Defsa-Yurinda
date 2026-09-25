/* Definisi alat: analisis saringan dan kurva gradasi. */
(function () {
  'use strict';

  var H = window.HitungSaringan, f = Umum.f;
  var NAMA = H.SARINGAN.map(function (s) { return s.nama; });

  function formatMm(v) { return f(v, v >= 1 ? (v >= 10 ? 1 : 2) : 3); }

  function grafik(r) {
    var dmaks = Math.max(10, Math.pow(10, Math.ceil(Math.log10(r.titik[0].mm)))), dmin = 0.01;
    var tanda = [];
    [['D₁₀', r.D10, 10], ['D₃₀', r.D30, 30], ['D₆₀', r.D60, 60]].forEach(function (d) {
      if (d[1]) tanda.push({ x: d[1], y: d[2], teks: d[0] + ' = ' + formatMm(d[1]) + ' mm', posisi: d[1] < Math.sqrt(dmin * dmaks) ? 'kiri' : 'kanan' });
    });
    return Grafik.plot({ id: 'gradasi', judul: 'Kurva gradasi', x: { min: dmin, max: dmaks, log: true, balik: true, label: 'Ukuran butir (mm, skala log)' },
      y: { min: 0, max: 100, label: 'Persen lolos (%)', tick: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
      vertikal: [{ x: 4.75, teks: 'No. 4' }, { x: 0.075, teks: 'No. 200' }],
      seri: [{ titik: r.titik.map(function (t) { return [t.mm, t.lolos]; }), penanda: true, warna: 'aksen' }],
      tanda: tanda });
  }

  Praktikum.pasang({
    id: 'saringan', judulEkspor: 'Analisa saringan (SNI 3423:2008)',
    parameter: [
      { id: 'beratTotal', label: 'Berat kering contoh', satuan: 'gram' },
      { id: 'pan', label: 'Berat tertahan di pan', satuan: 'gram', bantuan: 'Untuk memeriksa selisih penimbangan. Kosongkan bila tidak dicatat.' }],
    tabel: [{ id: 'ayakan', jenis: 'baris', judul: 'Berat tertahan tiap saringan', namaBaris: 'Saringan',
      pilihanBaris: NAMA, barisAwal: ['2"', '1½"', '1"', '⅜"', 'No. 4', 'No. 10', 'No. 40', 'No. 200'],
      infoBaris: function (n) { return '(' + formatMm(H.ukuran(n)) + ' mm)'; },
      kolomNilai: { id: 'tertahan', label: 'Berat tertahan (gram)' },
      keterangan: 'Susunan awal mengikuti form laboratorium. Saringan bisa ditambah atau dihapus; urutan otomatis dari yang terbesar.' }],
    contoh: { param: { beratTotal: 500, pan: 42.6 }, tabel: { ayakan: [
      { nama: '2"', nilai: 0 }, { nama: '1½"', nilai: 0 }, { nama: '1"', nilai: 0 }, { nama: '⅜"', nilai: 0 },
      { nama: 'No. 4', nilai: 12.5 }, { nama: 'No. 10', nilai: 48.3 }, { nama: 'No. 20', nilai: 92.1 }, { nama: 'No. 40', nilai: 110.4 },
      { nama: 'No. 60', nilai: 85.2 }, { nama: 'No. 100', nilai: 61.7 }, { nama: 'No. 200', nilai: 45.8 }] } },
    kosong: { param: { beratTotal: '', pan: '' } },
    hitung: function (m) {
      return H.hitung({ beratTotal: m.param.beratTotal, pan: m.param.pan,
        ayakan: m.tabel.ayakan.map(function (b) { return { nama: b.nama, tertahan: b.nilai }; }) });
    },
    // Untuk klasifikasi dan hidrometer: persen lolos saringan kunci dan besaran gradasi.
    hasil: function (m, r) {
      return { P4: H.lolosPada(r.titik, 4.75), P10: H.lolosPada(r.titik, 2), P40: H.lolosPada(r.titik, 0.425), P200: H.lolosPada(r.titik, 0.075),
        D10: r.D10, D30: r.D30, D60: r.D60, Cu: r.Cu, Cc: r.Cc };
    },
    tampil: function (m, r, U) {
      var h = '', kartu = [];
      if (r.fraksi) {
        kartu.push(U.kartu('Kerikil', f(r.fraksi.kerikil, 2) + ' <small>%</small>', '> 4,75 mm'),
          U.kartu('Pasir', f(r.fraksi.pasir, 2) + ' <small>%</small>', '4,75 – 0,075 mm'),
          U.kartu('Butir halus', f(r.fraksi.halus, 2) + ' <small>%</small>', '< 0,075 mm (lolos No. 200)'));
      }
      h += U.ringkasan(kartu.concat([U.kartu('Koefisien gradasi', r.Cu ? 'C<sub>u</sub> ' + f(r.Cu, 2) : '–',
        r.Cc ? 'C<sub>c</sub> = ' + f(r.Cc, 2) : 'D<sub>10</sub> tidak terbaca dari saringan')]));
      h += U.grafik(grafik(r), 'Kurva gradasi: persen lolos terhadap ukuran butir (log). D₁₀, D₃₀, D₆₀ dibaca dengan interpolasi pada skala log.');
      h += '<h3>Tabel hasil</h3>' + U.tabel([{ teks: 'Saringan' }, { teks: 'Ukuran (mm)', angka: true }, { teks: 'Tertahan (gram)', angka: true },
        { teks: 'Kumulatif (gram)' }, { teks: 'Tertahan kumulatif (%)' }, { teks: 'Lolos (%)' }],
      r.ayakan.map(function (a) { return [a.nama, formatMm(a.mm), f(a.tertahan, 3), f(a.kumulatif, 3), f(a.persenTertahan, 2), f(a.lolos, 2)]; }),
      ['Pan', '', f(r.pan, 3), f(r.jumlah, 3), '', '']);
      h += '<p class="kecil redup">Jumlah tertahan termasuk pan ' + f(r.jumlah, 3) + ' gram dari berat contoh ' + f(m.param.beratTotal, 3) + ' gram (selisih ' + f(r.hilang, 2) + '%).</p>';
      var a1 = r.ayakan.filter(function (a) { return a.tertahan > 0; })[0] || r.ayakan[0];
      h += '<h3>Langkah hitungan</h3>' + U.langkah('Persen tertahan dan lolos (saringan ' + a1.nama + ')',
        U.rumus('\\%\\,\\text{tertahan} = \\dfrac{\\sum W_{\\text{tertahan}}}{W_{\\text{total}}}\\times 100\\% = \\dfrac{' + U.t(a1.kumulatif, 3) + '}{' + U.t(m.param.beratTotal, 3) + '}\\times 100\\% = ' + U.t(a1.persenTertahan, 2) + '\\% \\qquad (1)') +
        U.rumus('\\%\\,\\text{lolos} = 100\\% - ' + U.t(a1.persenTertahan, 2) + '\\% = ' + U.t(a1.lolos, 2) + '\\% \\qquad (2)'));
      if (r.D10 && r.D30 && r.D60) {
        h += U.langkah('Koefisien keseragaman dan kelengkungan',
          U.rumus('C_u = \\dfrac{D_{60}}{D_{10}} = \\dfrac{' + U.t(r.D60, 3) + '}{' + U.t(r.D10, 3) + '} = ' + U.t(r.Cu, 2) + ' \\qquad (3)') +
          U.rumus('C_c = \\dfrac{D_{30}^2}{D_{10}\\,D_{60}} = \\dfrac{' + U.t(r.D30, 3) + '^2}{' + U.t(r.D10, 3) + '\\times' + U.t(r.D60, 3) + '} = ' + U.t(r.Cc, 2) + ' \\qquad (4)') +
          '<p class="ket">D<sub>x</sub> = ukuran butir (mm) dengan x% lolos, diinterpolasi linier pada log ukuran butir di antara dua saringan yang mengapitnya.</p>');
      }
      return h;
    },
    ekspor: function (m, r) {
      var b = [['Berat kering contoh', 'gram', m.param.beratTotal], [], ['Saringan', 'Ukuran (mm)', 'Tertahan (gram)', 'Kumulatif (gram)', 'Tertahan kumulatif (%)', 'Lolos (%)']];
      r.ayakan.forEach(function (a) { b.push([a.nama, a.mm, a.tertahan, a.kumulatif, a.persenTertahan, a.lolos]); });
      b.push(['Pan', '', r.pan, r.jumlah], []);
      ['D10', 'D30', 'D60'].forEach(function (k) { b.push([k, 'mm', r[k] || '']); });
      b.push(['Cu', '-', r.Cu || ''], ['Cc', '-', r.Cc || '']);
      if (r.fraksi) b.push(['Kerikil', '%', r.fraksi.kerikil], ['Pasir', '%', r.fraksi.pasir], ['Butir halus', '%', r.fraksi.halus]);
      return b;
    },
    sumber: ['Badan Standardisasi Nasional. SNI 3423:2008 <em>Cara uji analisis ukuran butir tanah</em>.',
      'Badan Standardisasi Nasional. SNI 6371:2015. Batas fraksi kerikil, pasir, dan butir halus.',
      'ASTM E11. Ukuran lubang saringan standar.']
  });
})();
