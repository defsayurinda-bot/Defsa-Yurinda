/* Definisi alat: pemadatan laboratorium dan kerucut pasir (sand cone). Halaman memilih lewat data-alat. */
(function () {
  'use strict';

  var H = window.HitungKepadatan, f = Umum.f, jenis = document.getElementById('alat-praktikum').dataset.alat;
  var KUNCI_HASIL_PEMADATAN = 'praktikum-hasil-pemadatan';

  function kolom(daftar, uraian, simbol, satuan, ambil, d) {
    return [uraian, simbol, satuan].concat(daftar.map(function (x) { return f(ambil(x), d); }));
  }
  function simpan(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* abaikan */ } }
  function baca(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

  if (jenis === 'pemadatan') {
    Praktikum.pasang({
      id: 'pemadatan', judulEkspor: 'Pengujian pemadatan',
      parameter: [
        { id: 'jenis', label: 'Jenis pemadatan', pilihan: [['ringan', 'Ringan (SNI 1742:2008)'], ['berat', 'Berat (SNI 1743:2008)']] },
        { id: 'Gs', label: 'Berat spesifik, G<sub>s</sub>', bantuan: 'Dari pemeriksaan berat spesifik; dipakai untuk garis ZAV.' },
        { id: 'V', label: 'Isi cetakan', satuan: 'cm³' },
        { id: 'Mcetakan', label: 'Massa cetakan', satuan: 'gram' },
        { id: 'orde', label: 'Kurva pemadatan', pilihan: [['3', 'Polinomial orde 3'], ['2', 'Polinomial orde 2']],
          bantuan: 'Orde 3 biasanya lebih mengikuti bentuk kurva bila titik ≥ 5; orde 2 lebih stabil bila titik sedikit.' }],
      tabel: [{ id: 'titik', judul: 'Data tiap titik pemadatan', kolom: 'Titik', awal: 5, min: 3, maks: 8, baris: [
        { id: 'Mtotal', label: 'Massa tanah basah + cetakan', simbol: 'W<sub>t</sub>', satuan: 'gram' },
        { id: 'W1', label: 'Massa tanah basah + cawan', simbol: 'W<sub>1</sub>', satuan: 'gram' },
        { id: 'W2', label: 'Massa tanah kering + cawan', simbol: 'W<sub>2</sub>', satuan: 'gram' },
        { id: 'W3', label: 'Massa cawan', simbol: 'W<sub>3</sub>', satuan: 'gram' }],
        keterangan: 'Tiap titik memakai satu cawan kadar air, seperti form laboratorium.' }],
      contoh: { param: { jenis: 'ringan', Gs: 2.65, V: 943.3, Mcetakan: 4185, orde: '3' }, tabel: { titik: [
        { nama: '1', Mtotal: 5901, W1: 60.2, W2: 55.9, W3: 12.1 }, { nama: '2', Mtotal: 6012.5, W1: 61.3, W2: 56.0, W3: 12.3 },
        { nama: '3', Mtotal: 6078, W1: 62.0, W2: 55.8, W3: 12.0 }, { nama: '4', Mtotal: 6071.2, W1: 63.1, W2: 56.0, W3: 12.2 },
        { nama: '5', Mtotal: 6025, W1: 64.0, W2: 56.1, W3: 12.4 }] } },
      kosong: { param: { jenis: 'ringan', Gs: '', V: '', Mcetakan: '', orde: '3' } },
      hitung: function (m) {
        var r = H.pemadatan({ Gs: m.param.Gs, V: m.param.V, Mcetakan: m.param.Mcetakan, gammaW: 1, orde: +m.param.orde, titik: m.tabel.titik });
        if (!r.galat.length) simpan(KUNCI_HASIL_PEMADATAN, { gdmaks: r.gdmaks, wopt: r.wopt });
        return r;
      },
      tampil: function (m, r, U) {
        var t = r.titik, h = '';
        h += U.ringkasan([U.kartu('Kadar air optimum', f(r.wopt, 2) + ' <small>%</small>', 'w<sub>opt</sub>'),
          U.kartu('Kepadatan kering maksimum', f(r.gdmaks, 3) + ' <small>g/cm³</small>', 'γ<sub>d maks</sub> · kurva orde ' + r.orde + ', R² = ' + f(r.kurva.r2, 3))]);
        var w0 = t[0].w, w1 = t[t.length - 1].w, lebar = w1 - w0;
        var xs = [], ys = [], zav = [];
        for (var i = 0; i <= 80; i++) { var w = w0 + lebar * i / 80; xs.push([w, r.kurva.f(w)]); }
        for (var j = 0; j <= 40; j++) { var wz = (w0 - lebar * 0.15) + lebar * 1.3 * j / 40; zav.push([wz, +m.param.Gs * r.gammaW / (1 + wz / 100 * +m.param.Gs)]); }
        var semuaY = t.map(function (x) { return x.gammaD; }).concat([r.gdmaks]);
        var ymin = Math.floor((Math.min.apply(null, semuaY) - 0.05) * 20) / 20, ymaks = Math.ceil((Math.max.apply(null, semuaY) + 0.08) * 20) / 20;
        h += U.grafik(Grafik.plot({ id: 'proctor', judul: 'Kurva pemadatan', x: { min: Math.floor(w0 - lebar * 0.15), max: Math.ceil(w1 + lebar * 0.15), label: 'Kadar air, w (%)' },
          y: { min: ymin, max: ymaks, label: 'Kepadatan kering, γd (g/cm³)' },
          seri: [{ titik: zav, warna: 'biru', putus: true, label: 'ZAV (Gs = ' + f(+m.param.Gs, 2) + ')' }, { titik: xs, warna: 'teks', label: 'Kurva orde ' + r.orde },
            { titik: t.map(function (x) { return [x.w, x.gammaD]; }), garis: false, penanda: true, warna: 'aksen', label: 'Titik uji' }],
          tanda: [{ x: r.wopt, y: r.gdmaks, teks: 'optimum (' + f(r.wopt, 2) + '%; ' + f(r.gdmaks, 3) + ')', atas: true, rata: r.wopt > (w0 + w1) / 2 ? 'kiri' : 'kanan' }] }),
          'Kurva pemadatan dengan garis rongga udara nol (ZAV). Titik optimum diambil dari puncak kurva di dalam rentang data.');
        h += '<h3>Tabel hasil</h3>' + U.tabel(['Uraian', 'Simbol', 'Satuan'].concat(t.map(function (x) { return 'Titik ' + x.nama; })), [
          kolom(t, 'Massa air', 'W<sub>1</sub> − W<sub>2</sub>', 'gram', function (x) { return x.air; }, 3),
          kolom(t, 'Massa tanah kering', 'W<sub>2</sub> − W<sub>3</sub>', 'gram', function (x) { return x.kering; }, 3),
          kolom(t, 'Kadar air', 'w', '%', function (x) { return x.w; }, 2),
          kolom(t, 'Massa tanah basah', 'W<sub>t</sub> − W<sub>m</sub>', 'gram', function (x) { return x.basah; }, 3),
          kolom(t, 'Kepadatan basah', 'γ', 'g/cm³', function (x) { return x.gamma; }, 3),
          kolom(t, 'Kepadatan kering', 'γ<sub>d</sub>', 'g/cm³', function (x) { return x.gammaD; }, 3),
          kolom(t, 'Kepadatan ZAV', 'γ<sub>zav</sub>', 'g/cm³', function (x) { return x.zav; }, 3)]);
        var a = t[0];
        h += '<h3>Langkah hitungan (titik ' + a.nama + ')</h3>' +
          U.langkah('Kepadatan basah', U.rumus('\\gamma = \\dfrac{W_t - W_m}{V} = \\dfrac{' + U.t(a.Mtotal, 3) + ' - ' + U.t(+m.param.Mcetakan, 3) + '}{' + U.t(+m.param.V, 3) + '} = ' + U.t(a.gamma, 3) + '\\ \\text{g/cm}^3 \\qquad (1)') +
            '<p class="ket">W<sub>t</sub> = massa tanah basah + cetakan; W<sub>m</sub> = massa cetakan; V = isi cetakan.</p>') +
          U.langkah('Kepadatan kering', U.rumus('\\gamma_d = \\dfrac{\\gamma}{1 + w} = \\dfrac{' + U.t(a.gamma, 3) + '}{1 + ' + U.t(a.w / 100, 4) + '} = ' + U.t(a.gammaD, 3) + '\\ \\text{g/cm}^3 \\qquad (2)')) +
          U.langkah('Garis rongga udara nol', U.rumus('\\gamma_{zav} = \\dfrac{G_s\\,\\gamma_w}{1 + w\\,G_s} = \\dfrac{' + U.t(+m.param.Gs, 3) + '\\times 1}{1 + ' + U.t(a.w / 100, 4) + '\\times' + U.t(+m.param.Gs, 3) + '} = ' + U.t(a.zav, 3) + '\\ \\text{g/cm}^3 \\qquad (3)')) +
          U.langkah('Kurva dan titik optimum', U.rumus('\\gamma_d(w) = ' + r.kurva.koef.map(function (c, k) { return (k === 0 ? U.t(c, 5) : (c < 0 ? ' - ' : ' + ') + U.t(Math.abs(c), 6) + (k === 1 ? 'w' : 'w^' + k)); }).join('')) +
            '<p>Puncak kurva di dalam rentang data: w<sub>opt</sub> = ' + f(r.wopt, 2) + '% dan γ<sub>d maks</sub> = ' + f(r.gdmaks, 3) + ' g/cm³. ' +
            'Sebagai pembanding, titik data tertinggi adalah titik ' + r.titikTertinggi.nama + ' (w = ' + f(r.titikTertinggi.w, 2) + '%, γ<sub>d</sub> = ' + f(r.titikTertinggi.gammaD, 3) + ' g/cm³).</p>');
        return h + '<p class="kecil redup">Hasil γ<sub>d maks</sub> tersimpan di browser dan otomatis tersedia di alat sand cone.</p>';
      },
      ekspor: function (m, r) {
        var t = r.titik, b = [['Jenis pemadatan', '', m.param.jenis], ['Gs', '-', +m.param.Gs], ['Isi cetakan', 'cm3', +m.param.V], ['Massa cetakan', 'gram', +m.param.Mcetakan], [],
          ['Uraian', 'Satuan'].concat(t.map(function (x) { return 'Titik ' + x.nama; }))];
        [['Massa tanah basah + cetakan', 'gram', 'Mtotal'], ['Massa tanah basah + cawan', 'gram', 'W1'], ['Massa tanah kering + cawan', 'gram', 'W2'], ['Massa cawan', 'gram', 'W3'],
          ['Kadar air', '%', 'w'], ['Massa tanah basah', 'gram', 'basah'], ['Kepadatan basah', 'g/cm3', 'gamma'], ['Kepadatan kering', 'g/cm3', 'gammaD'], ['Kepadatan ZAV', 'g/cm3', 'zav']]
          .forEach(function (x) { b.push([x[0], x[1]].concat(t.map(function (p) { return p[x[2]]; }))); });
        b.push([], ['Kadar air optimum', '%', r.wopt], ['Kepadatan kering maksimum', 'g/cm3', r.gdmaks], ['Kurva', '', 'polinomial orde ' + r.orde]);
        return b;
      },
      sumber: ['Badan Standardisasi Nasional. SNI 1742:2008 <em>Cara uji kepadatan ringan untuk tanah</em>.',
        'Badan Standardisasi Nasional. SNI 1743:2008 <em>Cara uji kepadatan berat untuk tanah</em>.',
        'Das, B. M. <em>Principles of geotechnical engineering</em>. Cengage Learning. Garis rongga udara nol.']
    });
  }

  if (jenis === 'sand-cone') {
    var lab = baca(KUNCI_HASIL_PEMADATAN);
    var BARIS = [
      ['W6', 'Berat tabung + kerucut + pasir sebelum (menentukan pasir dalam kerucut)', 'W<sub>6</sub>'],
      ['W7', 'Berat tabung + kerucut + pasir sesudah (menentukan pasir dalam kerucut)', 'W<sub>7</sub>'],
      ['W8', 'Berat tabung + kerucut + pasir sebelum pengujian', 'W<sub>8</sub>'],
      ['W9', 'Berat tabung + kerucut + pasir setelah pengujian', 'W<sub>9</sub>'],
      ['W10', 'Berat kaleng', 'W<sub>10</sub>'], ['W11', 'Berat kaleng + tanah galian', 'W<sub>11</sub>'],
      ['W12', 'Berat kontainer (kadar air)', 'W<sub>12</sub>'], ['W13', 'Berat kontainer + tanah basah', 'W<sub>13</sub>'], ['W14', 'Berat kontainer + tanah kering', 'W<sub>14</sub>']];
    Praktikum.pasang({
      id: 'sand-cone', judulEkspor: 'Uji kepadatan lapangan dengan kerucut pasir (SNI 2828:2011)',
      parameter: [
        { id: 'K1', label: 'Kalibrasi: berat tabung kalibrasi, W<sub>1</sub>', satuan: 'gram' },
        { id: 'K2', label: 'Kalibrasi: tabung + pasir, W<sub>2</sub>', satuan: 'gram' },
        { id: 'K3', label: 'Kalibrasi: tabung + air, W<sub>3</sub>', satuan: 'gram' },
        { id: 'gammaLab', label: 'γ<sub>d maks</sub> laboratorium', satuan: 'g/cm³',
          bantuan: lab ? 'Hasil terakhir alat pemadatan di browser ini: ' + f(lab.gdmaks, 3) + ' g/cm³.' : 'Dari uji pemadatan standar.' },
        { id: 'syarat', label: 'Derajat kepadatan minimum', satuan: '%', bantuan: 'Opsional, sesuai spesifikasi proyek.' }],
      tabel: [{ id: 'titik', judul: 'Data tiap titik uji', kolom: 'Titik', awal: 3, min: 1, maks: 6,
        baris: BARIS.map(function (b) { return { id: b[0], label: b[1], simbol: b[2], satuan: 'gram' }; }) }],
      contoh: { param: { K1: 1240, K2: 4012, K3: 3222, gammaLab: lab ? Math.round(lab.gdmaks * 1000) / 1000 : 1.62, syarat: 95 }, tabel: { titik: [
        { nama: '1', W6: 6000, W7: 4380, W8: 6000, W9: 2310, W10: 350, W11: 3050, W12: 15, W13: 115, W14: 100.2 },
        { nama: '2', W6: 6000, W7: 4382, W8: 6000, W9: 2255, W10: 352, W11: 3120, W12: 14.8, W13: 118.4, W14: 103.1 },
        { nama: '3', W6: 6000, W7: 4379, W8: 6000, W9: 2402, W10: 349, W11: 2990, W12: 15.1, W13: 112.6, W14: 98.4 }] } },
      kosong: { param: { K1: '', K2: '', K3: '', gammaLab: lab ? Math.round(lab.gdmaks * 1000) / 1000 : '', syarat: '' } },
      hitung: function (m) {
        return H.sandCone({ kalibrasi: { W1: m.param.K1, W2: m.param.K2, W3: m.param.K3 }, titik: m.tabel.titik, gammaLab: m.param.gammaLab, syarat: m.param.syarat });
      },
      tampil: function (m, r, U) {
        var t = r.titik, h = '', kartu = [U.kartu('γ<sub>d</sub> lapangan rata-rata', f(r.gammaD, 3) + ' <small>g/cm³</small>', 'kadar air rata-rata ' + f(r.w, 2) + '%')];
        if (r.D !== undefined) {
          kartu.push(U.kartu('Derajat kepadatan', f(r.D, 2) + ' <small>%</small>',
            r.memenuhi === undefined ? 'terhadap γ<sub>d maks</sub> ' + f(m.param.gammaLab, 3) + ' g/cm³' : (r.memenuhi ? '✓ memenuhi' : '✗ belum memenuhi') + ' syarat ' + f(m.param.syarat, 0) + '%'));
        }
        h += U.ringkasan(kartu);
        h += '<h3>Tabel hasil</h3>' + U.tabel(['Uraian', 'Simbol', 'Satuan'].concat(t.map(function (x) { return 'Titik ' + x.nama; })), [
          kolom(t, 'Pasir dalam kerucut', 'W<sub>6</sub> − W<sub>7</sub>', 'gram', function (x) { return x.kerucut; }, 3),
          kolom(t, 'Pasir dalam kerucut + lubang', 'W<sub>8</sub> − W<sub>9</sub>', 'gram', function (x) { return x.total; }, 3),
          kolom(t, 'Pasir dalam lubang', '(W<sub>8</sub> − W<sub>9</sub>) − (W<sub>6</sub> − W<sub>7</sub>)', 'gram', function (x) { return x.lubang; }, 3),
          kolom(t, 'Volume lubang', 'V', 'cm³', function (x) { return x.V; }, 3),
          kolom(t, 'Berat tanah galian', 'W<sub>11</sub> − W<sub>10</sub>', 'gram', function (x) { return x.Wt; }, 3),
          kolom(t, 'Kadar air', 'w', '%', function (x) { return x.w; }, 2),
          kolom(t, 'Berat kering', 'W<sub>d</sub>', 'gram', function (x) { return x.Wd; }, 3),
          kolom(t, 'Berat isi basah', 'γ', 'g/cm³', function (x) { return x.gamma; }, 3),
          kolom(t, 'Berat isi kering', 'γ<sub>d</sub>', 'g/cm³', function (x) { return x.gammaD; }, 3)]
          .concat(r.D !== undefined ? [kolom(t, 'Derajat kepadatan', 'D', '%', function (x) { return x.D; }, 2)] : []));
        var a = t[0];
        h += '<h3>Langkah hitungan (titik ' + a.nama + ')</h3>' +
          U.langkah('Berat isi pasir uji (kalibrasi)', U.rumus('\\gamma_{\\text{pasir}} = \\dfrac{W_2 - W_1}{W_3 - W_1} = \\dfrac{' + U.t(+m.param.K2, 3) + ' - ' + U.t(+m.param.K1, 3) + '}{' + U.t(+m.param.K3, 3) + ' - ' + U.t(+m.param.K1, 3) + '} = ' + U.t(r.gammaPasir, 3) + '\\ \\text{g/cm}^3 \\qquad (1)') +
            '<p class="ket">W<sub>3</sub> − W<sub>1</sub> = berat air = volume tabung kalibrasi (γ<sub>w</sub> = 1 g/cm³).</p>') +
          U.langkah('Volume lubang', U.rumus('V = \\dfrac{(W_8 - W_9) - (W_6 - W_7)}{\\gamma_{\\text{pasir}}} = \\dfrac{' + U.t(a.total, 3) + ' - ' + U.t(a.kerucut, 3) + '}{' + U.t(r.gammaPasir, 3) + '} = ' + U.t(a.V, 3) + '\\ \\text{cm}^3 \\qquad (2)')) +
          U.langkah('Kadar air dan berat kering', U.rumus('w = \\dfrac{W_{13} - W_{14}}{W_{14} - W_{12}} = \\dfrac{' + U.t(a.W13, 3) + ' - ' + U.t(a.W14, 3) + '}{' + U.t(a.W14, 3) + ' - ' + U.t(a.W12, 3) + '} = ' + U.t(a.w, 2) + '\\% \\qquad (3)') +
            U.rumus('W_d = \\dfrac{W_{11} - W_{10}}{1 + w} = \\dfrac{' + U.t(a.Wt, 3) + '}{1 + ' + U.t(a.w / 100, 4) + '} = ' + U.t(a.Wd, 3) + '\\ \\text{gram} \\qquad (4)')) +
          U.langkah('Berat isi kering dan derajat kepadatan', U.rumus('\\gamma_d = \\dfrac{W_d}{V} = \\dfrac{' + U.t(a.Wd, 3) + '}{' + U.t(a.V, 3) + '} = ' + U.t(a.gammaD, 3) + '\\ \\text{g/cm}^3 \\qquad (5)') +
            (r.D !== undefined ? U.rumus('D = \\dfrac{\\gamma_{d,\\text{lap}}}{\\gamma_{d,\\text{lab}}}\\times 100\\% = \\dfrac{' + U.t(r.gammaD, 3) + '}{' + U.t(+m.param.gammaLab, 3) + '}\\times 100\\% = ' + U.t(r.D, 2) + '\\% \\qquad (6)') +
              '<p class="ket">γ<sub>d,lap</sub> memakai rata-rata semua titik uji.</p>' : ''));
        return h;
      },
      ekspor: function (m, r) {
        var t = r.titik, b = [['Kalibrasi W1', 'gram', +m.param.K1], ['Kalibrasi W2', 'gram', +m.param.K2], ['Kalibrasi W3', 'gram', +m.param.K3], ['Berat isi pasir', 'g/cm3', r.gammaPasir], [],
          ['Uraian', 'Satuan'].concat(t.map(function (x) { return 'Titik ' + x.nama; }))];
        BARIS.forEach(function (x) { b.push([x[1], 'gram'].concat(t.map(function (p) { return p[x[0]]; }))); });
        [['Volume lubang', 'cm3', 'V'], ['Kadar air', '%', 'w'], ['Berat kering', 'gram', 'Wd'], ['Berat isi kering', 'g/cm3', 'gammaD'], ['Derajat kepadatan', '%', 'D']]
          .forEach(function (x) { b.push([x[0], x[1]].concat(t.map(function (p) { return p[x[2]]; }))); });
        b.push([], ['Berat isi kering rata-rata', 'g/cm3', r.gammaD]);
        if (r.D !== undefined) b.push(['Derajat kepadatan', '%', r.D]);
        return b;
      },
      sumber: ['Badan Standardisasi Nasional. SNI 2828:2011 <em>Metode uji densitas tanah di tempat (lapangan) dengan alat konus pasir</em>.']
    });
  }
})();
