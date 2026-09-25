/* Definisi alat: kadar air dan berat spesifik. Halaman memilih alat lewat data-alat. */
(function () {
  'use strict';

  var H = window.HitungSifatFisik, jenis = document.getElementById('alat-praktikum').dataset.alat;
  var f = Umum.f;

  // Tabel kolom: [uraian, simbol, satuan, nilai per kolom…]
  function barisKolom(daftar, uraian, simbol, satuan, ambil, d) {
    return [uraian, simbol, satuan].concat(daftar.map(function (x) { return f(ambil(x), d); }));
  }
  function kepalaKolom(daftar, nama) {
    return ['Uraian', 'Simbol', 'Satuan'].concat(daftar.map(function (x) { return nama + ' ' + x.nama; }));
  }

  if (jenis === 'kadar-air') {
    Praktikum.pasang({
      id: 'kadar-air', judulEkspor: 'Pemeriksaan kadar air (SNI 1965:2008)',
      tabel: [{ id: 'cawan', judul: 'Data penimbangan', kolom: 'Cawan', awal: 3, min: 1, maks: 8, baris: [
        { id: 'W1', label: 'Berat cawan + tanah basah', simbol: 'W<sub>1</sub>', satuan: 'gram' },
        { id: 'W2', label: 'Berat cawan + tanah kering', simbol: 'W<sub>2</sub>', satuan: 'gram' },
        { id: 'W3', label: 'Berat cawan kosong', simbol: 'W<sub>3</sub>', satuan: 'gram' }] }],
      contoh: { param: {}, tabel: { cawan: [
        { nama: '1', W1: 45.31, W2: 38.62, W3: 12.10 }, { nama: '2', W1: 47.85, W2: 40.71, W3: 13.42 }, { nama: '3', W1: 44.02, W2: 37.60, W3: 11.95 }] } },
      hitung: function (m) { return H.kadarAir({ cawan: m.tabel.cawan }); },
      tampil: function (m, r, U) {
        var c = r.cawan, c1 = c[0];
        return U.ringkasan([U.kartu('Kadar air rata-rata', f(r.w, 2) + ' <small>%</small>', c.length + ' cawan · rentang ' + f(r.rentang, 2) + '%')]) +
          '<h3>Tabel hasil</h3>' + U.tabel(kepalaKolom(c, 'Cawan'), [
            barisKolom(c, 'Berat cawan + tanah basah', 'W<sub>1</sub>', 'gram', function (x) { return x.W1; }, 3),
            barisKolom(c, 'Berat cawan + tanah kering', 'W<sub>2</sub>', 'gram', function (x) { return x.W2; }, 3),
            barisKolom(c, 'Berat cawan kosong', 'W<sub>3</sub>', 'gram', function (x) { return x.W3; }, 3),
            barisKolom(c, 'Berat air', 'W<sub>1</sub> − W<sub>2</sub>', 'gram', function (x) { return x.air; }, 3),
            barisKolom(c, 'Berat tanah kering', 'W<sub>2</sub> − W<sub>3</sub>', 'gram', function (x) { return x.kering; }, 3),
            barisKolom(c, 'Kadar air', 'w', '%', function (x) { return x.w; }, 2)]) +
          '<h3>Langkah hitungan (' + 'cawan ' + c1.nama + ')</h3>' +
          U.langkah('Kadar air', U.rumus('w = \\dfrac{W_1 - W_2}{W_2 - W_3}\\times 100\\% \\qquad (1)') +
            U.rumus('w = \\dfrac{' + U.t(c1.W1, 3) + ' - ' + U.t(c1.W2, 3) + '}{' + U.t(c1.W2, 3) + ' - ' + U.t(c1.W3, 3) + '}\\times 100\\% = \\dfrac{' + U.t(c1.air, 3) + '}{' + U.t(c1.kering, 3) + '}\\times 100\\% = ' + U.t(c1.w, 2) + '\\%') +
            '<p class="ket">W<sub>1</sub> = berat cawan + tanah basah; W<sub>2</sub> = berat cawan + tanah kering; W<sub>3</sub> = berat cawan kosong (gram).</p>') +
          U.langkah('Rata-rata', U.rumus('\\bar{w} = \\dfrac{' + c.map(function (x) { return U.t(x.w, 2); }).join(' + ') + '}{' + c.length + '} = ' + U.t(r.w, 2) + '\\%'));
      },
      ekspor: function (m, r) {
        var c = r.cawan;
        return [['Uraian', 'Satuan'].concat(c.map(function (x) { return 'Cawan ' + x.nama; }))]
          .concat([['Berat cawan + tanah basah (W1)', 'gram', 'W1'], ['Berat cawan + tanah kering (W2)', 'gram', 'W2'], ['Berat cawan kosong (W3)', 'gram', 'W3'],
            ['Berat air (W1 − W2)', 'gram', 'air'], ['Berat tanah kering (W2 − W3)', 'gram', 'kering'], ['Kadar air (w)', '%', 'w']]
            .map(function (b) { return [b[0], b[1]].concat(c.map(function (x) { return x[b[2]]; })); }))
          .concat([[], ['Kadar air rata-rata', '%', r.w]]);
      },
      sumber: ['Badan Standardisasi Nasional. SNI 1965:2008 <em>Cara uji penentuan kadar air untuk tanah dan batuan di laboratorium</em>.',
        'Hardiyatmo, H. C. <em>Mekanika Tanah I</em>. Gadjah Mada University Press.']
    });
  }

  if (jenis === 'berat-spesifik') {
    var ACUAN_GS = [['Kerikil', '2,65 – 2,68'], ['Pasir', '2,65 – 2,68'], ['Lanau organik', '2,62 – 2,68'], ['Lempung organik', '2,58 – 2,65'],
      ['Lempung anorganik', '2,68 – 2,75'], ['Humus', '1,37'], ['Gambut', '1,25 – 1,28']];
    Praktikum.pasang({
      id: 'berat-spesifik', judulEkspor: 'Pemeriksaan berat spesifik (SNI 1964:2008)',
      parameter: [{ id: 'Tacuan', label: 'Suhu acuan koreksi', pilihan: [['27.5', '27,5 °C (seperti form lab)'], ['20', '20 °C (ASTM D854)']],
        bantuan: 'Gs dikoreksi ke suhu acuan dengan perbandingan massa jenis air.' }],
      tabel: [{ id: 'uji', judul: 'Data penimbangan', kolom: 'Piknometer', awal: 2, min: 1, maks: 6, baris: [
        { id: 'W1', label: 'Berat piknometer', simbol: 'W<sub>1</sub>', satuan: 'gram' },
        { id: 'W2', label: 'Berat piknometer + tanah kering', simbol: 'W<sub>2</sub>', satuan: 'gram' },
        { id: 'W3', label: 'Berat piknometer + tanah + air', simbol: 'W<sub>3</sub>', satuan: 'gram' },
        { id: 'W4', label: 'Berat piknometer + air', simbol: 'W<sub>4</sub>', satuan: 'gram' },
        { id: 'T', label: 'Suhu air saat penimbangan', simbol: 'T', satuan: '°C' },
        { id: 'rhoT', label: 'Massa jenis air pada T', simbol: 'ρ<sub>w,T</sub>', satuan: 'g/cm³', opsional: true }],
        keterangan: 'Kosongkan ρ<sub>w,T</sub> supaya dihitung otomatis dari suhu (Tanaka dkk., 2001), atau isi dengan nilai dari tabel laboratorium.' }],
      contoh: { param: { Tacuan: '27.5' }, tabel: { uji: [
        { nama: '1', W1: 34.215, W2: 59.215, W3: 149.812, W4: 134.180, T: 27.5 },
        { nama: '2', W1: 35.102, W2: 60.102, W3: 150.540, W4: 134.955, T: 28 }] } },
      kosong: { param: { Tacuan: '27.5' } },
      hitung: function (m) { return H.beratSpesifik({ uji: m.tabel.uji, Tacuan: +m.param.Tacuan }); },
      tampil: function (m, r, U) {
        var u = r.uji, u1 = u[0], Ta = +m.param.Tacuan;
        return U.ringkasan([U.kartu('Berat spesifik rata-rata', f(r.G, 3), 'Gs pada ' + f(Ta, 1) + ' °C · ' + u.length + ' piknometer')]) +
          '<h3>Tabel hasil</h3>' + U.tabel(kepalaKolom(u, 'Piknometer'), [
            barisKolom(u, 'Berat tanah', 'W<sub>2</sub> − W<sub>1</sub>', 'gram', function (x) { return x.Ws; }, 3),
            barisKolom(u, 'Berat air yang dipindahkan', '(W<sub>4</sub> − W<sub>1</sub>) − (W<sub>3</sub> − W<sub>2</sub>)', 'gram', function (x) { return x.pembagi; }, 3),
            barisKolom(u, 'Berat spesifik pada suhu T', 'G<sub>T</sub>', '–', function (x) { return x.GT; }, 3),
            barisKolom(u, 'Massa jenis air pada T', 'ρ<sub>w,T</sub>', 'g/cm³', function (x) { return x.rhoT; }, 5),
            barisKolom(u, 'Berat spesifik pada ' + f(Ta, 1) + ' °C', 'G<sub>s</sub>', '–', function (x) { return x.G; }, 3)]) +
          '<h3>Langkah hitungan (piknometer ' + u1.nama + ')</h3>' +
          U.langkah('Berat spesifik pada suhu T', U.rumus('G_T = \\dfrac{W_2 - W_1}{(W_4 - W_1) - (W_3 - W_2)} \\qquad (1)') +
            U.rumus('G_T = \\dfrac{' + U.t(u1.W2, 3) + ' - ' + U.t(u1.W1, 3) + '}{(' + U.t(u1.W4, 3) + ' - ' + U.t(u1.W1, 3) + ') - (' + U.t(u1.W3, 3) + ' - ' + U.t(u1.W2, 3) + ')} = \\dfrac{' + U.t(u1.Ws, 3) + '}{' + U.t(u1.pembagi, 3) + '} = ' + U.t(u1.GT, 4)) +
            '<p class="ket">W<sub>1</sub> = piknometer; W<sub>2</sub> = piknometer + tanah kering; W<sub>3</sub> = piknometer + tanah + air; W<sub>4</sub> = piknometer + air (gram).</p>') +
          U.langkah('Koreksi suhu', U.rumus('G_s = G_T\\,\\dfrac{\\rho_{w,T}}{\\rho_{w,' + U.t(Ta, 1) + '}} \\qquad (2)') +
            U.rumus('G_s = ' + U.t(u1.GT, 4) + '\\times\\dfrac{' + U.t(u1.rhoT, 5) + '}{' + U.t(r.rhoAcuan, 5) + '} = ' + U.t(u1.G, 3)) +
            '<p class="ket">ρ<sub>w</sub> ' + (u1.rhoManual ? 'pada T diisi manual; ' : '') + 'dihitung dari suhu dengan rumus Tanaka dkk. (2001).</p>') +
          (u.length > 1 ? U.langkah('Rata-rata', U.rumus('\\bar{G_s} = \\dfrac{' + u.map(function (x) { return U.t(x.G, 3); }).join(' + ') + '}{' + u.length + '} = ' + U.t(r.G, 3))) : '') +
          '<h3>Pembanding</h3>' + U.tabel([{ teks: 'Macam tanah' }, { teks: 'Berat jenis (G<sub>s</sub>)', angka: true }], ACUAN_GS) +
          '<p class="kecil redup">Sumber: Hardiyatmo (2012), seperti dikutip dalam panduan laporan praktikum.</p>';
      },
      ekspor: function (m, r) {
        var u = r.uji;
        return [['Uraian', 'Satuan'].concat(u.map(function (x) { return 'Piknometer ' + x.nama; }))]
          .concat([['W1 piknometer', 'gram', 'W1'], ['W2 piknometer + tanah', 'gram', 'W2'], ['W3 piknometer + tanah + air', 'gram', 'W3'], ['W4 piknometer + air', 'gram', 'W4'],
            ['Suhu T', '°C', 'T'], ['Berat tanah (W2 − W1)', 'gram', 'Ws'], ['(W4 − W1) − (W3 − W2)', 'gram', 'pembagi'], ['G pada T', '-', 'GT'],
            ['Massa jenis air pada T', 'g/cm3', 'rhoT'], ['Gs pada suhu acuan', '-', 'G']]
            .map(function (b) { return [b[0], b[1]].concat(u.map(function (x) { return x[b[2]]; })); }))
          .concat([[], ['Suhu acuan', '°C', +m.param.Tacuan], ['Gs rata-rata', '-', r.G]]);
      },
      sumber: ['Badan Standardisasi Nasional. SNI 1964:2008 <em>Cara uji berat jenis tanah</em>.',
        'Tanaka, M., Girard, G., Davis, R., Peuto, A., &amp; Bignell, N. (2001). Recommended table for the density of water between 0 °C and 40 °C based on recent experimental reports. <em>Metrologia, 38</em>(4), 301–309.',
        'Hardiyatmo, H. C. <em>Mekanika Tanah I</em>. Gadjah Mada University Press.']
    });
  }
})();
