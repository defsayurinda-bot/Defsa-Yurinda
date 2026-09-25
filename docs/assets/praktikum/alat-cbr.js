/* Definisi alat: CBR laboratorium (dua permukaan, pengembangan, dan berat isi). */
(function () {
  'use strict';

  var H = window.HitungCBR, f = Umum.f;
  var WAKTU = [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 10, 12];
  var KGF_KN = 0.00980665;

  // Penetrasi baku 1,27 mm/menit; kolom penetrasi terisi supaya cukup mengetik beban.
  function barisAwal() { return WAKTU.map(function (t) { return { t: t, penetrasi: Math.round(1.27 * t * 100) / 100 }; }); }
  function kolomBaca() {
    return [{ id: 't', label: 'Waktu', satuan: 'menit', kunci: true, opsional: true }, { id: 'penetrasi', label: 'Penetrasi', satuan: 'mm', kunci: true },
      { id: 'beban', label: 'Beban / bacaan' }];
  }
  function keKN(v, p) { return p.satuanBeban === 'kgf' ? v * KGF_KN : p.satuanBeban === 'arloji' ? v * p.kalibrasi : v; }

  function grafik(r) {
    var semua = [], xmaks = 0, ymaks = 0, warna = ['aksen', 'biru'];
    r.set.forEach(function (s) { s.titik.forEach(function (t) { xmaks = Math.max(xmaks, t.x); ymaks = Math.max(ymaks, t.y); }); });
    var seri = [], tanda = [], vertikal = [{ x: 2.54, teks: '2,54' }, { x: 5.08, teks: '5,08' }];
    r.set.forEach(function (s, i) {
      seri.push({ titik: s.titik.map(function (t) { return [t.x, t.y]; }), penanda: true, warna: warna[i], label: s.nama });
      if (s.koreksi.x0 > 0) {
        var t0 = s.titik[s.koreksi.segmen];
        seri.push({ titik: [[s.koreksi.x0, 0], [t0.x + 1.5, t0.y + s.koreksi.lereng * (t0.x + 1.5 - t0.x)]], warna: warna[i], putus: true, tebal: 1.4 });
      }
      // Permukaan pertama diberi label di kiri atas titik, permukaan kedua di kanan bawah, supaya tidak bertumpuk.
      var letak = i === 0 ? { posisi: 'kiri', atas: true } : { posisi: 'kanan', bawah: true };
      if (s.P1 !== null) tanda.push(Object.assign({ x: s.x1, y: s.P1, teks: s.nama + ' ' + f(s.CBR1, 1) + '%' }, letak));
      if (s.P2 !== null) tanda.push(Object.assign({ x: s.x2, y: s.P2, teks: s.nama + ' ' + f(s.CBR2, 1) + '%' }, letak));
    });
    semua = semua.concat(seri);
    return Grafik.plot({ id: 'cbr', judul: 'Kurva beban penetrasi', x: { min: 0, max: Math.ceil(Math.max(xmaks, 6) / 2) * 2, label: 'Penetrasi (mm)' },
      y: { min: 0, max: Math.ceil(ymaks * 1.15 * 10) / 10 || 1, label: 'Beban (kN)' }, seri: semua, vertikal: vertikal, tanda: tanda });
  }

  Praktikum.pasang({
    id: 'cbr', judulEkspor: 'Pemeriksaan CBR laboratorium (SNI 1744:2012)',
    parameter: [
      { id: 'jenis', label: 'Kondisi benda uji', pilihan: [['rendaman', 'Rendaman (soaked)'], ['tanpa', 'Tanpa rendaman (unsoaked)']] },
      { id: 'satuanBeban', label: 'Kolom beban berisi', pilihan: [['kN', 'Beban dalam kN (seperti form lab)'], ['kgf', 'Beban dalam kgf'], ['arloji', 'Bacaan arloji cincin beban']] },
      { id: 'kalibrasi', label: 'Kalibrasi cincin beban', satuan: 'kN/divisi', tampilJika: function (p) { return p.satuanBeban === 'arloji'; } },
      { id: 'A', label: 'Luas piston', satuan: 'mm²', bantuan: 'Piston standar 1935 mm² (3 in², diameter ±49,6 mm).' },
      { id: 'std1', label: 'Tegangan standar pada 2,54 mm', satuan: 'MPa', bantuan: '6,9 MPa (1000 psi), ASTM D1883.' },
      { id: 'std2', label: 'Tegangan standar pada 5,08 mm', satuan: 'MPa', bantuan: '10,3 MPa (1500 psi), ASTM D1883.' },
      { id: 'koreksi', label: 'Koreksi titik nol', pilihan: [['otomatis', 'Otomatis bila awal kurva cekung'], ['tidak', 'Tanpa koreksi'], ['manual', 'Geser manual']] },
      { id: 'koreksiManual', label: 'Pergeseran titik nol', satuan: 'mm', tampilJika: function (p) { return p.koreksi === 'manual'; } },
      { id: 'H0', label: 'Tinggi benda uji', satuan: 'mm', bantuan: 'Untuk persen pengembangan. Cetakan ASTM D1883: 116,4 mm.' },
      { id: 'satuanArloji', label: 'Satuan arloji pengembangan', pilihan: [['0.0254', '0,001 inci (0,0254 mm)'], ['0.01', '0,01 mm'], ['0.002', '0,002 mm']] },
      { id: 'gdmaks', label: 'γ<sub>d maks</sub> laboratorium', satuan: 'g/cm³', bantuan: 'Opsional, untuk derajat kepadatan benda uji.',
        dariAlat: { alat: 'pemadatan', nama: 'pemadatan', ambil: function (h) { return h.gdmaks; }, d: 3 } }],
    tabel: [
      { id: 'atas', jenis: 'daftar', judul: 'Penetrasi permukaan atas', namaPendek: 'Penetrasi atas', maks: 20, awal: barisAwal(), kolom: kolomBaca(),
        keterangan: 'Kecepatan penetrasi 1,27 mm/menit, jadi penetrasi sudah terisi. Ubah bila bacaan arloji penetrasi berbeda.' },
      { id: 'bawah', jenis: 'daftar', judul: 'Penetrasi permukaan bawah (opsional)', namaPendek: 'Penetrasi bawah', maks: 20, awal: barisAwal(), kolom: kolomBaca() },
      { id: 'kondisi', judul: 'Berat isi dan kadar air', kolom: 'Kondisi', awal: 2, min: 1, maks: 2, baris: [
        { id: 'Wt', label: 'Berat tanah + cetakan', simbol: 'W<sub>t</sub>', satuan: 'gram' },
        { id: 'Wm', label: 'Berat cetakan', simbol: 'W<sub>m</sub>', satuan: 'gram' },
        { id: 'V', label: 'Isi cetakan', simbol: 'V', satuan: 'cm³' },
        { id: 'W1', label: 'Cawan + tanah basah', simbol: 'W<sub>1</sub>', satuan: 'gram', opsional: true },
        { id: 'W2', label: 'Cawan + tanah kering', simbol: 'W<sub>2</sub>', satuan: 'gram', opsional: true },
        { id: 'W3', label: 'Berat cawan', simbol: 'W<sub>3</sub>', satuan: 'gram', opsional: true }],
        keterangan: 'Kolom pertama sebelum perendaman, kolom kedua sesudah. Nama kolom bisa diubah.' },
      { id: 'swell', jenis: 'daftar', judul: 'Pengembangan selama perendaman (opsional)', namaPendek: 'Pengembangan', maks: 20, awal: 5,
        kolom: [{ id: 'waktu', label: 'Tanggal / jam', teks: true }, { id: 'bacaan', label: 'Bacaan arloji', satuan: 'divisi' }] }],
    contoh: { param: { jenis: 'rendaman', satuanBeban: 'kN', kalibrasi: '', A: 1935, std1: 6.9, std2: 10.3, koreksi: 'otomatis', koreksiManual: '', H0: 116.4, satuanArloji: '0.0254', gdmaks: 1.75 },
      tabel: {
        atas: barisAwal().map(function (b, i) { b.beban = [0, 0.18, 0.36, 0.66, 0.90, 1.10, 1.42, 1.60, 1.98, 2.22, 2.40, 2.55][i]; return b; }),
        bawah: barisAwal().map(function (b, i) { b.beban = [0, 0.05, 0.14, 0.40, 0.68, 0.92, 1.30, 1.44, 1.74, 1.98, 2.15, 2.28][i]; return b; }),
        kondisi: [{ nama: 'Sebelum', Wt: 9850, Wm: 5480, V: 2124, W1: 58.4, W2: 50.9, W3: 12.3 }, { nama: 'Sesudah', Wt: 9960, Wm: 5480, V: 2124, W1: 60.1, W2: 51.2, W3: 12.2 }],
        swell: [{ waktu: 'Hari 0, 08.00', bacaan: 0 }, { waktu: 'Hari 1, 08.00', bacaan: 45 }, { waktu: 'Hari 2, 08.00', bacaan: 78 }, { waktu: 'Hari 3, 08.00', bacaan: 96 }, { waktu: 'Hari 4, 08.00', bacaan: 104 }] } },
    kosong: { param: { jenis: 'rendaman', satuanBeban: 'kN', kalibrasi: '', A: 1935, std1: 6.9, std2: 10.3, koreksi: 'otomatis', koreksiManual: '', H0: 116.4, satuanArloji: '0.0254', gdmaks: '' },
      tabel: { atas: barisAwal(), bawah: barisAwal(), kondisi: [{ nama: 'Sebelum' }, { nama: 'Sesudah' }] } },
    hitung: function (m) {
      var p = m.param;
      if (p.satuanBeban === 'arloji' && !(p.kalibrasi > 0)) return { galat: ['Isi kalibrasi cincin beban (kN per divisi).'] };
      function ubah(daftar) { return daftar.map(function (b) { return Object.assign({}, b, { bacaan: b.beban, beban: keKN(b.beban, p) }); }); }
      return H.hitung({ A: p.A, std1: p.std1, std2: p.std2, koreksi: p.koreksi, koreksiManual: p.koreksiManual, gdmaks: p.gdmaks, H0: p.H0, satuanArloji: +p.satuanArloji,
        atas: ubah(m.tabel.atas), bawah: ubah(m.tabel.bawah), kondisi: m.tabel.kondisi, swell: m.tabel.swell });
    },
    hasil: function (m, r) { return { CBR: r.CBR, pengembangan: r.pengembangan }; },
    tampil: function (m, r, U) {
      var p = m.param, h = '', kartu = [];
      if (r.CBR !== undefined) kartu.push(U.kartu('CBR ' + (p.jenis === 'rendaman' ? 'rendaman' : 'tanpa rendaman'), f(r.CBR, 2) + ' <small>%</small>', r.set.length > 1 ? 'rata-rata ' + r.set.length + ' permukaan' : r.set[0].nama.toLowerCase()));
      r.set.forEach(function (s) {
        kartu.push(U.kartu(s.nama, s.CBR1 !== undefined ? f(s.CBR1, 2) + ' <small>%</small>' : '–',
          '2,54 mm' + (s.CBR2 !== undefined ? '; 5,08 mm: ' + f(s.CBR2, 2) + '%' : '') + (s.koreksi.x0 > 0 ? '; titik nol digeser ' + f(s.koreksi.x0, 2) + ' mm' : '')));
      });
      if (r.pengembangan !== undefined) kartu.push(U.kartu('Pengembangan', f(r.pengembangan, 2) + ' <small>%</small>', 'terhadap tinggi ' + f(p.H0, 1) + ' mm'));
      var awal = r.kondisi.filter(function (k) { return k.gammaD !== undefined; })[0];
      if (awal) kartu.push(U.kartu('γ<sub>d</sub> ' + awal.nama.toLowerCase(), f(awal.gammaD, 3) + ' <small>g/cm³</small>', r.D !== undefined ? 'derajat kepadatan ' + f(r.D, 2) + '%' : 'w = ' + f(awal.w, 2) + '%'));
      h += U.ringkasan(kartu);
      h += U.grafik(grafik(r), 'Kurva beban penetrasi. Garis putus-putus menunjukkan koreksi titik nol bila awal kurva cekung ke atas.');
      h += '<h3>Tabel nilai CBR</h3>' + U.tabel([{ teks: 'Permukaan' }, { teks: 'Titik nol (mm)', angka: true }, { teks: 'P<sub>2,54</sub> (kN)', angka: true }, 'σ<sub>2,54</sub> (MPa)', 'CBR<sub>2,54</sub> (%)', 'P<sub>5,08</sub> (kN)', 'σ<sub>5,08</sub> (MPa)', 'CBR<sub>5,08</sub> (%)'],
        r.set.map(function (s) { return [s.nama, f(s.koreksi.x0, 2), s.P1 !== null ? f(s.P1, 3) : '–', s.s1 !== undefined ? f(s.s1, 3) : '–', s.CBR1 !== undefined ? f(s.CBR1, 2) : '–', s.P2 !== null ? f(s.P2, 3) : '–', s.s2 !== undefined ? f(s.s2, 3) : '–', s.CBR2 !== undefined ? f(s.CBR2, 2) : '–']; }));
      r.set.forEach(function (s) {
        h += '<h3>Tabel beban penetrasi ' + s.nama.toLowerCase() + '</h3>' + U.tabel([{ teks: 'Penetrasi (mm)' }, { teks: 'Beban (kN)', angka: true }, { teks: 'Tegangan (MPa)', angka: true }],
          s.titik.map(function (t) { return [f(t.x, 2), f(t.y, 3), f(t.y * 1000 / p.A, 3)]; }), null, { angkaMulai: 1 });
      });
      var kk = r.kondisi.filter(function (k) { return k.gamma !== undefined; });
      if (kk.length) {
        h += '<h3>Tabel berat isi</h3>' + U.tabel(['Uraian', 'Simbol', 'Satuan'].concat(kk.map(function (k) { return k.nama; })), [
          ['Berat tanah basah', 'W<sub>t</sub> − W<sub>m</sub>', 'gram'].concat(kk.map(function (k) { return f(k.basah, 3); })),
          ['Berat isi basah', 'γ', 'g/cm³'].concat(kk.map(function (k) { return f(k.gamma, 3); })),
          ['Kadar air', 'w', '%'].concat(kk.map(function (k) { return k.w !== undefined ? f(k.w, 2) : '–'; })),
          ['Berat isi kering', 'γ<sub>d</sub>', 'g/cm³'].concat(kk.map(function (k) { return k.gammaD !== undefined ? f(k.gammaD, 3) : '–'; }))]);
      }
      if (r.swell) {
        h += '<h3>Tabel pengembangan</h3>' + U.tabel([{ teks: 'Tanggal / jam' }, { teks: 'Bacaan (divisi)', angka: true }, { teks: 'Perubahan (mm)', angka: true }, 'Pengembangan (%)'],
          r.swell.map(function (s) { return [(s.waktu || ('Bacaan ' + s.no)), f(s.bacaan, 1), f(s.dh, 3), f(s.persen, 2)]; }), null, { angkaMulai: 1 });
      }
      var s0 = r.set[0];
      h += '<h3>Langkah hitungan (' + s0.nama.toLowerCase() + ')</h3>';
      if (p.satuanBeban !== 'kN') h += '<p class="ket">Beban diubah ke kN: ' + (p.satuanBeban === 'kgf' ? '1 kgf = 0,00980665 kN.' : 'bacaan × ' + f(p.kalibrasi, 5) + ' kN/divisi.') + '</p>';
      if (s0.koreksi.x0 > 0) {
        var ts = s0.titik[s0.koreksi.segmen];
        h += U.langkah('Koreksi titik nol', '<p>Awal kurva cekung ke atas. Kemiringan terbesar ada pada segmen ' + f(ts.x, 2) + '–' + f(s0.titik[s0.koreksi.segmen + 1].x, 2) + ' mm.</p>' +
          U.rumus('x_0 = x_i - \\dfrac{P_i}{m} = ' + U.t(ts.x, 2) + ' - \\dfrac{' + U.t(ts.y, 3) + '}{' + U.t(s0.koreksi.lereng, 4) + '} = ' + U.t(s0.koreksi.x0, 3) + '\\ \\text{mm} \\qquad (1)') +
          '<p class="ket">Beban dibaca pada ' + f(s0.x1, 2) + ' mm dan ' + f(s0.x2, 2) + ' mm (interpolasi linier).</p>');
      }
      if (s0.P1 !== null) {
        h += U.langkah('Tegangan dan CBR pada 2,54 mm', U.rumus('\\sigma = \\dfrac{P}{A} = \\dfrac{' + U.t(s0.P1, 3) + '\\times 1000}{' + U.t(p.A, 0) + '} = ' + U.t(s0.s1, 3) + '\\ \\text{MPa} \\qquad (2)') +
          U.rumus('CBR_{2{,}54} = \\dfrac{\\sigma}{\\sigma_{std}}\\times 100\\% = \\dfrac{' + U.t(s0.s1, 3) + '}{' + U.t(p.std1, 1) + '}\\times 100\\% = ' + U.t(s0.CBR1, 2) + '\\% \\qquad (3)'));
      }
      if (s0.P2 !== null) {
        h += U.langkah('CBR pada 5,08 mm', U.rumus('CBR_{5{,}08} = \\dfrac{' + U.t(s0.P2, 3) + '\\times 1000 / ' + U.t(p.A, 0) + '}{' + U.t(p.std2, 1) + '}\\times 100\\% = ' + U.t(s0.CBR2, 2) + '\\% \\qquad (4)') +
          '<p class="ket">Nilai CBR yang dilaporkan biasanya pada 2,54 mm. Bila nilai 5,08 mm lebih besar, pengujian diulang; bila tetap, nilai 5,08 mm yang dipakai.</p>');
      }
      if (r.swell) {
        var sa = r.swell[r.swell.length - 1];
        h += U.langkah('Pengembangan', U.rumus('\\text{Pengembangan} = \\dfrac{(' + U.t(sa.bacaan, 1) + ' - ' + U.t(r.swell[0].bacaan, 1) + ')\\times' + U.t(+p.satuanArloji, 4) + '}{' + U.t(p.H0, 1) + '}\\times 100\\% = ' + U.t(r.pengembangan, 2) + '\\% \\qquad (5)'));
      }
      if (awal) {
        h += U.langkah('Berat isi kering', U.rumus('\\gamma_d = \\dfrac{\\gamma}{1 + w} = \\dfrac{' + U.t(awal.gamma, 3) + '}{1 + ' + U.t(awal.w / 100, 4) + '} = ' + U.t(awal.gammaD, 3) + '\\ \\text{g/cm}^3 \\qquad (6)') +
          (r.D !== undefined ? U.rumus('D = \\dfrac{' + U.t(awal.gammaD, 3) + '}{' + U.t(p.gdmaks, 3) + '}\\times 100\\% = ' + U.t(r.D, 2) + '\\% \\qquad (7)') : ''));
      }
      return h;
    },
    ekspor: function (m, r) {
      var b = [['Luas piston', 'mm2', m.param.A], ['Tegangan standar 2,54 mm', 'MPa', m.param.std1], ['Tegangan standar 5,08 mm', 'MPa', m.param.std2], []];
      r.set.forEach(function (s) {
        b.push([s.nama.toUpperCase()], ['Penetrasi (mm)', 'Beban (kN)', 'Tegangan (MPa)']);
        s.titik.forEach(function (t) { b.push([t.x, t.y, t.y * 1000 / m.param.A]); });
        b.push(['Titik nol (mm)', s.koreksi.x0], ['CBR 2,54 mm (%)', s.CBR1 === undefined ? '' : s.CBR1], ['CBR 5,08 mm (%)', s.CBR2 === undefined ? '' : s.CBR2], []);
      });
      if (r.CBR !== undefined) b.push(['CBR', '%', r.CBR]);
      if (r.pengembangan !== undefined) b.push(['Pengembangan', '%', r.pengembangan]);
      r.kondisi.forEach(function (k) { if (k.gamma !== undefined) b.push(['Berat isi basah ' + k.nama, 'g/cm3', k.gamma], ['Kadar air ' + k.nama, '%', k.w === undefined ? '' : k.w], ['Berat isi kering ' + k.nama, 'g/cm3', k.gammaD === undefined ? '' : k.gammaD]); });
      return b;
    },
    sumber: ['Badan Standardisasi Nasional. SNI 1744:2012 <em>Metode uji CBR laboratorium</em>. Mengacu AASHTO T 193 dan ASTM D1883.',
      'ASTM D1883. <em>Standard test method for California Bearing Ratio (CBR) of laboratory-compacted soils</em>. Tegangan standar 6,9 MPa dan 10,3 MPa, koreksi kurva cekung.']
  });
})();
