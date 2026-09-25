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
      hasil: function (m, r) { return { w: r.w }; },
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
      hasil: function (m, r) { return { G: r.G, Tacuan: +m.param.Tacuan }; },
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
  if (jenis === 'hubungan-fase') {
    var CARA = [['w-gamma', 'G<sub>s</sub>, w, dan γ basah'], ['w-gammad', 'G<sub>s</sub>, w, dan γ<sub>d</sub>'], ['cincin', 'G<sub>s</sub>, w, massa dan volume cincin'], ['e-Sr', 'G<sub>s</sub>, e, dan S<sub>r</sub>']];
    var G_KN = 9.81; // g/cm³ → kN/m³
    var ada = function (daftar) { return function (p) { return daftar.indexOf(p.cara || 'w-gamma') >= 0; }; };

    var diagram = function (r) {
      var v = r.volume, x0 = 250, lebar = 170, y0 = 24, tinggi = 250, s = '<svg class="grafik" viewBox="0 0 640 300" role="img" aria-label="Diagram fase">';
      var massa = { udara: 0, air: v.air * 1, butir: v.butir * r.Gs };
      var y = y0;
      [['udara', 'Udara', 'var(--permukaan)', 'a'], ['air', 'Air', '#3a7fc1', 'w'], ['butir', 'Butiran', 'var(--pasir)', 's']].forEach(function (z) {
        var h = tinggi * v[z[0]];
        if (h > 0.2) {
          s += '<rect x="' + x0 + '" y="' + y + '" width="' + lebar + '" height="' + h + '" style="fill:' + z[2] + ';' + (z[0] === 'air' ? 'fill-opacity:.35;' : '') + 'stroke:var(--teks);stroke-width:1.4"/>';
          var tengah = y + h / 2 + 4.5;
          if (h >= 16) s += '<text x="' + (x0 + lebar / 2) + '" y="' + tengah + '" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--teks)">' + z[1] + '</text>';
          s += '<line x1="' + (x0 - 14) + '" x2="' + (x0 - 14) + '" y1="' + (y + 2) + '" y2="' + (y + h - 2) + '" style="stroke:var(--teks-2)"/>';
          s += '<text x="' + (x0 - 22) + '" y="' + tengah + '" text-anchor="end" font-size="12.5" style="fill:var(--teks)">V<tspan font-size="10" dy="3">' + z[3] + '</tspan><tspan dy="-3"> = ' + f(v[z[0]], 3) + '</tspan></text>';
          s += '<line x1="' + (x0 + lebar + 14) + '" x2="' + (x0 + lebar + 14) + '" y1="' + (y + 2) + '" y2="' + (y + h - 2) + '" style="stroke:var(--teks-2)"/>';
          s += '<text x="' + (x0 + lebar + 22) + '" y="' + tengah + '" font-size="12.5" style="fill:var(--teks)">M<tspan font-size="10" dy="3">' + z[3] + '</tspan><tspan dy="-3"> = ' + f(massa[z[0]], 3) + ' g</tspan></text>';
        }
        y += h;
      });
      s += '<text x="' + (x0 + lebar / 2) + '" y="16" text-anchor="middle" font-size="12" style="fill:var(--teks-2)">untuk V = 1 cm³ · M = ' + f(r.gamma, 3) + ' g</text>';
      s += '<text x="20" y="' + (y0 + tinggi / 2) + '" font-size="12.5" style="fill:var(--teks-2)">Volume (cm³)</text><text x="620" y="' + (y0 + tinggi / 2) + '" text-anchor="end" font-size="12.5" style="fill:var(--teks-2)">Massa</text>';
      return s + '</svg>';
    };

    Praktikum.pasang({
      id: 'hubungan-fase', judulEkspor: 'Hubungan berat dan volume tanah',
      parameter: [
        { id: 'cara', label: 'Data yang diketahui', pilihan: CARA.map(function (c) { return [c[0], c[1].replace(/<[^>]+>/g, '')]; }) },
        { id: 'Gs', label: 'Berat spesifik, G<sub>s</sub>', dariAlat: { alat: 'berat-spesifik', nama: 'berat spesifik', ambil: function (h) { return h.G; }, d: 3 } },
        { id: 'w', label: 'Kadar air, w', satuan: '%', tampilJika: ada(['w-gamma', 'w-gammad', 'cincin']),
          dariAlat: { alat: 'kadar-air', nama: 'kadar air', ambil: function (h) { return h.w; }, d: 2 } },
        { id: 'gamma', label: 'Berat isi basah, γ', satuan: 'g/cm³', tampilJika: ada(['w-gamma']) },
        { id: 'gammaD', label: 'Berat isi kering, γ<sub>d</sub>', satuan: 'g/cm³', tampilJika: ada(['w-gammad']),
          dariAlat: { alat: 'pemadatan', nama: 'pemadatan (γd maks)', ambil: function (h) { return h.gdmaks; }, d: 3 } },
        { id: 'M', label: 'Massa tanah basah dalam cincin', satuan: 'gram', tampilJika: ada(['cincin']) },
        { id: 'V', label: 'Volume cincin', satuan: 'cm³', tampilJika: ada(['cincin']), bantuan: 'π d² h / 4 dari ukuran dalam cincin.' },
        { id: 'e', label: 'Angka pori, e', tampilJika: ada(['e-Sr']) },
        { id: 'Sr', label: 'Derajat kejenuhan, S<sub>r</sub>', satuan: '%', tampilJika: ada(['e-Sr']) }],
      tabel: [],
      contoh: { param: { cara: 'w-gamma', Gs: 2.68, w: 24.5, gamma: 1.86, gammaD: '', M: '', V: '', e: '', Sr: '' }, tabel: {} },
      kosong: { param: { cara: 'w-gamma', Gs: '', w: '', gamma: '', gammaD: '', M: '', V: '', e: '', Sr: '' } },
      hitung: function (m) { return H.hubunganFase(m.param); },
      hasil: function (m, r) { return { e: r.e, n: r.n, Sr: r.Sr, gammaD: r.gammaD, gamma: r.gamma }; },
      tampil: function (m, r, U) {
        var p = m.param, h = '';
        h += U.ringkasan([U.kartu('Angka pori', f(r.e, 3), 'e'), U.kartu('Porositas', f(r.n, 2) + ' <small>%</small>', 'n'),
          U.kartu('Derajat kejenuhan', f(r.Sr, 2) + ' <small>%</small>', 'S<sub>r</sub>'), U.kartu('Berat isi kering', f(r.gammaD, 3) + ' <small>g/cm³</small>', f(r.gammaD * G_KN, 2) + ' kN/m³')]);
        h += U.grafik(diagram(r), 'Diagram fase untuk volume total 1 cm³. Massa udara dianggap nol.');
        h += '<h3>Tabel hasil</h3>' + U.tabel(['Besaran', 'Simbol', 'Satuan', 'Nilai', 'Dalam kN/m³'], [
          ['Kadar air', 'w', '%', f(r.w, 2), ''], ['Berat isi basah', 'γ', 'g/cm³', f(r.gamma, 3), f(r.gamma * G_KN, 2)],
          ['Berat isi kering', 'γ<sub>d</sub>', 'g/cm³', f(r.gammaD, 3), f(r.gammaD * G_KN, 2)], ['Berat isi jenuh', 'γ<sub>sat</sub>', 'g/cm³', f(r.gammaSat, 3), f(r.gammaSat * G_KN, 2)],
          ['Berat isi terendam', 'γ′', 'g/cm³', f(r.gammaApung, 3), f(r.gammaApung * G_KN, 2)], ['Angka pori', 'e', '–', f(r.e, 3), ''],
          ['Porositas', 'n', '%', f(r.n, 2), ''], ['Derajat kejenuhan', 'S<sub>r</sub>', '%', f(r.Sr, 2), ''], ['Kadar udara', 'A', '%', f(r.udara, 2), '']]);
        h += '<p class="kecil redup">Konversi ke kN/m³ memakai g = 9,81 m/s² (γ<sub>w</sub> = 9,81 kN/m³).</p>';
        h += '<h3>Langkah hitungan</h3>';
        var no = 0;
        if (p.cara === 'e-Sr') {
          h += U.langkah('Kadar air dan berat isi', U.rumus('w = \\dfrac{S_r\\,e}{G_s} = \\dfrac{' + U.t(r.Sr / 100, 4) + '\\times' + U.t(r.e, 3) + '}{' + U.t(r.Gs, 3) + '} = ' + U.t(r.w, 2) + '\\% \\qquad (' + (++no) + ')') +
            U.rumus('\\gamma_d = \\dfrac{G_s\\,\\gamma_w}{1 + e} = \\dfrac{' + U.t(r.Gs, 3) + '}{1 + ' + U.t(r.e, 3) + '} = ' + U.t(r.gammaD, 3) + '\\ \\text{g/cm}^3 \\qquad (' + (++no) + ')') +
            U.rumus('\\gamma = \\gamma_d\\,(1 + w) = ' + U.t(r.gammaD, 3) + '\\times(1 + ' + U.t(r.w / 100, 4) + ') = ' + U.t(r.gamma, 3) + '\\ \\text{g/cm}^3 \\qquad (' + (++no) + ')'));
        } else {
          if (p.cara === 'cincin') h += U.langkah('Berat isi basah', U.rumus('\\gamma = \\dfrac{M}{V} = \\dfrac{' + U.t(p.M, 2) + '}{' + U.t(p.V, 2) + '} = ' + U.t(r.gamma, 3) + '\\ \\text{g/cm}^3 \\qquad (' + (++no) + ')'));
          h += U.langkah('Berat isi kering', p.cara === 'w-gammad' ? '<p>γ<sub>d</sub> diketahui = ' + f(r.gammaD, 3) + ' g/cm³, sehingga γ = γ<sub>d</sub> (1 + w) = ' + f(r.gamma, 3) + ' g/cm³.</p>' :
            U.rumus('\\gamma_d = \\dfrac{\\gamma}{1 + w} = \\dfrac{' + U.t(r.gamma, 3) + '}{1 + ' + U.t(r.w / 100, 4) + '} = ' + U.t(r.gammaD, 3) + '\\ \\text{g/cm}^3 \\qquad (' + (++no) + ')'));
          h += U.langkah('Angka pori dan porositas', U.rumus('e = \\dfrac{G_s\\,\\gamma_w}{\\gamma_d} - 1 = \\dfrac{' + U.t(r.Gs, 3) + '\\times 1}{' + U.t(r.gammaD, 3) + '} - 1 = ' + U.t(r.e, 3) + ' \\qquad (' + (++no) + ')') +
            U.rumus('n = \\dfrac{e}{1 + e} = \\dfrac{' + U.t(r.e, 3) + '}{1 + ' + U.t(r.e, 3) + '} = ' + U.t(r.n, 2) + '\\% \\qquad (' + (++no) + ')'));
          h += U.langkah('Derajat kejenuhan', U.rumus('S_r = \\dfrac{w\\,G_s}{e} = \\dfrac{' + U.t(r.w / 100, 4) + '\\times' + U.t(r.Gs, 3) + '}{' + U.t(r.e, 3) + '} = ' + U.t(r.Sr, 2) + '\\% \\qquad (' + (++no) + ')'));
        }
        h += U.langkah('Berat isi jenuh dan terendam', U.rumus('\\gamma_{sat} = \\dfrac{(G_s + e)\\,\\gamma_w}{1 + e} = \\dfrac{' + U.t(r.Gs, 3) + ' + ' + U.t(r.e, 3) + '}{1 + ' + U.t(r.e, 3) + '} = ' + U.t(r.gammaSat, 3) + '\\ \\text{g/cm}^3 \\qquad (' + (++no) + ')') +
          U.rumus('\\gamma\' = \\gamma_{sat} - \\gamma_w = ' + U.t(r.gammaSat, 3) + ' - 1 = ' + U.t(r.gammaApung, 3) + '\\ \\text{g/cm}^3 \\qquad (' + (++no) + ')'));
        return h;
      },
      ekspor: function (m, r) {
        return [['Besaran', 'Satuan', 'Nilai', 'kN/m3'], ['Gs', '-', r.Gs], ['Kadar air w', '%', r.w], ['Berat isi basah', 'g/cm3', r.gamma, r.gamma * G_KN],
          ['Berat isi kering', 'g/cm3', r.gammaD, r.gammaD * G_KN], ['Berat isi jenuh', 'g/cm3', r.gammaSat, r.gammaSat * G_KN], ['Berat isi terendam', 'g/cm3', r.gammaApung, r.gammaApung * G_KN],
          ['Angka pori e', '-', r.e], ['Porositas n', '%', r.n], ['Derajat kejenuhan', '%', r.Sr], ['Kadar udara', '%', r.udara]];
      },
      sumber: ['Das, B. M. <em>Principles of geotechnical engineering</em>. Cengage Learning. Hubungan berat–volume.',
        'Hardiyatmo, H. C. <em>Mekanika Tanah I</em>. Gadjah Mada University Press.']
    });
  }
})();
