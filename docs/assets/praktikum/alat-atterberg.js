/* Definisi alat: batas Atterberg (batas cair, batas plastis, indeks plastisitas). */
(function () {
  'use strict';

  var H = window.HitungAtterberg, f = Umum.f;

  function kolom(daftar, uraian, simbol, satuan, ambil, d) {
    return [uraian, simbol, satuan].concat(daftar.map(function (x) { return f(ambil(x), d); }));
  }

  function grafikAliran(r) {
    var t = r.titikLL, ws = t.map(function (x) { return x.w; });
    var ymin = Math.floor(Math.min.apply(null, ws.concat([r.LL])) - 2), ymaks = Math.ceil(Math.max.apply(null, ws.concat([r.LL])) + 2);
    var seri = [{ titik: t.map(function (x) { return [x.N, x.w]; }), garis: false, penanda: true, warna: 'aksen', label: 'Titik uji' }];
    if (r.kurva) {
      seri.unshift({ titik: [10, 100].map(function (N) { return [N, r.kurva.a + r.kurva.b * Math.log10(N)]; }), warna: 'teks', label: 'Kurva aliran' });
    }
    return Grafik.plot({ id: 'aliran', judul: 'Kurva aliran batas cair', x: { min: 10, max: 100, log: true, label: 'Jumlah ketukan, N (skala log)', tick: [10, 15, 20, 25, 30, 40, 50, 70, 100] },
      y: { min: ymin, max: ymaks, label: 'Kadar air, w (%)' }, seri: seri, vertikal: [{ x: 25, teks: 'N = 25' }],
      tanda: [{ x: 25, y: r.LL, teks: 'LL = ' + f(r.LL, 2) + '%', posisi: 'kanan' }] });
  }

  function bagan(r) {
    var LLm = Math.max(100, Math.ceil((r.LL + 10) / 10) * 10), IPm = Math.max(60, Math.ceil((r.IP + 10) / 10) * 10);
    var gA = [[20, 0], [LLm, H.garisA(LLm)]], gU = [[8, 0], [LLm, H.garisU(LLm)]];
    // Label zona diletakkan jauh dari titik tanah supaya tidak bertumpuk.
    var teks = [[44, 27, 'CL'], [70, 48, 'CH'], [42, 6, 'ML'], [80, 22, 'MH']]
      .filter(function (z) { return r.NP || Math.abs(z[0] - r.LL) > 7 || Math.abs(z[1] - r.IP) > 5; })
      .map(function (z) { return { x: z[0], y: z[1], teks: z[2], titik: false }; });
    return Grafik.plot({ id: 'plastisitas', judul: 'Bagan plastisitas', x: { min: 0, max: LLm, label: 'Batas cair, LL (%)' }, y: { min: 0, max: IPm, label: 'Indeks plastisitas, IP (%)' },
      area: [{ titik: [[25.48, 4], [29.59, 7], [7 / 0.9 + 8, 7], [4 / 0.9 + 8, 4]], warna: 'teks' }],
      seri: [{ titik: gA, warna: 'teks', label: 'Garis A: IP = 0,73 (LL − 20)' }, { titik: gU, warna: 'redup', putus: true, label: 'Garis U: IP = 0,9 (LL − 8)' }],
      vertikal: [{ x: 50 }],
      tanda: teks.concat(r.NP ? [] : [{ x: r.LL, y: r.IP, teks: (r.klas ? r.klas.simbol : '') + ' (' + f(r.LL, 1) + '; ' + f(r.IP, 1) + ')', posisi: r.LL > LLm * 0.7 ? 'kiri' : 'kanan' }]) });
  }

  Praktikum.pasang({
    id: 'atterberg', judulEkspor: 'Pengujian konsistensi Atterberg (SNI 1967:2008 & SNI 1966:2008)',
    parameter: [
      { id: 'metodeLL', label: 'Cara menentukan batas cair', pilihan: [['banyak', 'Banyak titik (kurva aliran)'], ['satu', 'Satu titik']],
        bantuan: 'Banyak titik: garis lurus kadar air terhadap log N. Satu titik: tiap titik dikoreksi ke 25 ketukan.' },
      { id: 'eksponen', label: 'Eksponen metode satu titik, β', bantuan: '0,121 (ASTM D4318). Hanya dipakai pada metode satu titik.' },
      { id: 'wn', label: 'Kadar air asli, w<sub>n</sub>', satuan: '%', bantuan: 'Opsional, untuk indeks cair dan indeks konsistensi.' }],
    tabel: [
      { id: 'll', judul: 'Batas cair (LL)', kolom: 'Titik', awal: 4, min: 1, maks: 6, baris: [
        { id: 'N', label: 'Banyaknya pukulan', simbol: 'N', satuan: '–' },
        { id: 'W1', label: 'Berat cawan + tanah basah', simbol: 'W<sub>1</sub>', satuan: 'gram' },
        { id: 'W2', label: 'Berat cawan + tanah kering', simbol: 'W<sub>2</sub>', satuan: 'gram' },
        { id: 'W3', label: 'Berat cawan', simbol: 'W<sub>3</sub>', satuan: 'gram' }] },
      { id: 'pl', judul: 'Batas plastis (PL)', kolom: 'Cawan', awal: 2, min: 1, maks: 4, baris: [
        { id: 'W1', label: 'Berat cawan + tanah basah', simbol: 'W<sub>1</sub>', satuan: 'gram' },
        { id: 'W2', label: 'Berat cawan + tanah kering', simbol: 'W<sub>2</sub>', satuan: 'gram' },
        { id: 'W3', label: 'Berat cawan', simbol: 'W<sub>3</sub>', satuan: 'gram' }] }],
    contoh: { param: { metodeLL: 'banyak', eksponen: 0.121, wn: 30 }, tabel: {
      ll: [{ nama: '1', N: 38, W1: 30.12, W2: 25.60, W3: 12.05 }, { nama: '2', N: 29, W1: 31.40, W2: 26.35, W3: 12.20 },
        { nama: '3', N: 21, W1: 32.05, W2: 26.52, W3: 12.31 }, { nama: '4', N: 15, W1: 33.10, W2: 27.01, W3: 12.40 }],
      pl: [{ nama: '1', W1: 20.45, W2: 18.92, W3: 11.80 }, { nama: '2', W1: 21.02, W2: 19.38, W3: 12.01 }] } },
    kosong: { param: { metodeLL: 'banyak', eksponen: 0.121, wn: '' } },
    hitung: function (m) {
      return H.hitung({ ll: m.tabel.ll, pl: m.tabel.pl, metodeLL: m.param.metodeLL, eksponen: m.param.eksponen, wn: m.param.wn });
    },
    tampil: function (m, r, U) {
      var L = r.titikLL, P = r.titikPL, h = '';
      h += U.ringkasan([
        U.kartu('Batas cair', f(r.LL, 2) + ' <small>%</small>', r.kurva ? 'kurva aliran, R² = ' + f(r.kurva.r2, 3) : 'metode satu titik'),
        U.kartu('Batas plastis', f(r.PL, 2) + ' <small>%</small>', P.length + ' cawan'),
        U.kartu('Indeks plastisitas', r.NP ? 'NP' : f(r.IP, 2) + ' <small>%</small>', r.klas ? r.klas.simbol + ' · ' + r.klas.nama : 'nonplastis')]);
      h += U.grafik(grafikAliran(r), 'Kurva aliran: kadar air terhadap jumlah ketukan (log). Batas cair dibaca pada N = 25.');
      if (!r.NP) h += U.grafik(bagan(r), 'Bagan plastisitas untuk tanah berbutir halus (SNI 6371:2015). Area berarsir: zona CL-ML.');
      h += '<h3>Tabel hasil batas cair</h3>' + U.tabel(['Uraian', 'Simbol', 'Satuan'].concat(L.map(function (x) { return 'Titik ' + x.nama; })), [
        kolom(L, 'Banyaknya pukulan', 'N', '–', function (x) { return x.N; }, 0),
        kolom(L, 'Berat air', 'W<sub>1</sub> − W<sub>2</sub>', 'gram', function (x) { return x.air; }, 3),
        kolom(L, 'Berat tanah kering', 'W<sub>2</sub> − W<sub>3</sub>', 'gram', function (x) { return x.kering; }, 3),
        kolom(L, 'Kadar air', 'w', '%', function (x) { return x.w; }, 2)].concat(m.param.metodeLL === 'satu' ? [kolom(L, 'LL satu titik', 'w (N/25)<sup>β</sup>', '%', function (x) { return x.LL1; }, 2)] : []));
      h += '<h3>Tabel hasil batas plastis</h3>' + U.tabel(['Uraian', 'Simbol', 'Satuan'].concat(P.map(function (x) { return 'Cawan ' + x.nama; })), [
        kolom(P, 'Berat air', 'W<sub>1</sub> − W<sub>2</sub>', 'gram', function (x) { return x.air; }, 3),
        kolom(P, 'Berat tanah kering', 'W<sub>2</sub> − W<sub>3</sub>', 'gram', function (x) { return x.kering; }, 3),
        kolom(P, 'Kadar air', 'w', '%', function (x) { return x.w; }, 2)]);

      h += '<h3>Langkah hitungan</h3>';
      h += U.langkah('Kadar air tiap cawan', U.rumus('w = \\dfrac{W_1 - W_2}{W_2 - W_3}\\times 100\\% \\qquad (1)') +
        U.rumus('w_{\\text{titik } ' + L[0].nama + '} = \\dfrac{' + U.t(L[0].air, 3) + '}{' + U.t(L[0].kering, 3) + '}\\times 100\\% = ' + U.t(L[0].w, 2) + '\\%'));
      if (r.kurva) {
        h += U.langkah('Batas cair dari kurva aliran', U.rumus('w = a + b\\,\\log N \\qquad (2)') +
          U.rumus('a = ' + U.t(r.kurva.a, 3) + ',\\quad b = ' + U.t(r.kurva.b, 3) + ',\\quad R^2 = ' + U.t(r.kurva.r2, 3)) +
          U.rumus('LL = a + b\\,\\log 25 = ' + U.t(r.kurva.a, 3) + ' + (' + U.t(r.kurva.b, 3) + ')\\times ' + U.t(Math.log10(25), 4) + ' = ' + U.t(r.LL, 2) + '\\%') +
          '<p class="ket">a dan b dihitung dengan kuadrat terkecil dari ' + L.length + ' titik. Indeks aliran I<sub>f</sub> = −b = ' + f(-r.kurva.b, 2) + '.</p>');
      } else {
        h += U.langkah('Batas cair metode satu titik', U.rumus('LL = w_N\\left(\\dfrac{N}{25}\\right)^{\\beta},\\ \\beta = ' + U.t(r.eksponen, 3) + ' \\qquad (2)') +
          U.rumus('LL_{\\text{titik } ' + L[0].nama + '} = ' + U.t(L[0].w, 2) + '\\times\\left(\\dfrac{' + U.t(L[0].N, 0) + '}{25}\\right)^{' + U.t(r.eksponen, 3) + '} = ' + U.t(L[0].LL1, 2) + '\\%') +
          (L.length > 1 ? U.rumus('LL = \\text{rata-rata} = ' + U.t(r.LL, 2) + '\\%') : ''));
      }
      h += U.langkah('Batas plastis dan indeks plastisitas', U.rumus('PL = \\dfrac{' + P.map(function (x) { return U.t(x.w, 2); }).join(' + ') + '}{' + P.length + '} = ' + U.t(r.PL, 2) + '\\% \\qquad (3)') +
        (r.NP ? '<p>PL ≥ LL, sehingga tanah dilaporkan nonplastis (NP).</p>' : U.rumus('IP = LL - PL = ' + U.t(r.LL, 2) + ' - ' + U.t(r.PL, 2) + ' = ' + U.t(r.IP, 2) + '\\% \\qquad (4)')));
      if (r.LI !== undefined) {
        h += U.langkah('Indeks cair dan indeks konsistensi', U.rumus('LI = \\dfrac{w_n - PL}{IP} = \\dfrac{' + U.t(m.param.wn, 2) + ' - ' + U.t(r.PL, 2) + '}{' + U.t(r.IP, 2) + '} = ' + U.t(r.LI, 2)) +
          U.rumus('CI = \\dfrac{LL - w_n}{IP} = \\dfrac{' + U.t(r.LL, 2) + ' - ' + U.t(m.param.wn, 2) + '}{' + U.t(r.IP, 2) + '} = ' + U.t(r.CI, 2)));
      }
      if (r.klas) {
        h += U.langkah('Posisi di bagan plastisitas', U.rumus('IP_{\\text{garis A}} = 0{,}73\\,(LL - 20) = 0{,}73\\times(' + U.t(r.LL, 2) + ' - 20) = ' + U.t(r.garisA, 2) + '\\%') +
          '<p>IP = ' + f(r.IP, 2) + '% ' + (r.IP >= r.garisA ? 'di atas atau pada' : 'di bawah') + ' garis A dan LL ' + (r.LL < 50 ? '< 50%' : '≥ 50%') +
          ', sehingga tanah halus ini bersimbol <strong>' + r.klas.simbol + '</strong> (' + r.klas.nama.toLowerCase() + '). Klasifikasi lengkap juga membutuhkan data gradasi.</p>');
      }
      return h;
    },
    ekspor: function (m, r) {
      var L = r.titikLL, P = r.titikPL, b = [['BATAS CAIR'], ['Uraian', 'Satuan'].concat(L.map(function (x) { return 'Titik ' + x.nama; }))];
      [['Banyaknya pukulan (N)', '-', 'N'], ['W1 cawan + tanah basah', 'gram', 'W1'], ['W2 cawan + tanah kering', 'gram', 'W2'], ['W3 cawan', 'gram', 'W3'],
        ['Berat air', 'gram', 'air'], ['Berat tanah kering', 'gram', 'kering'], ['Kadar air', '%', 'w']]
        .forEach(function (x) { b.push([x[0], x[1]].concat(L.map(function (t) { return t[x[2]]; }))); });
      b.push([], ['BATAS PLASTIS'], ['Uraian', 'Satuan'].concat(P.map(function (x) { return 'Cawan ' + x.nama; })));
      [['W1 cawan + tanah basah', 'gram', 'W1'], ['W2 cawan + tanah kering', 'gram', 'W2'], ['W3 cawan', 'gram', 'W3'], ['Kadar air', '%', 'w']]
        .forEach(function (x) { b.push([x[0], x[1]].concat(P.map(function (t) { return t[x[2]]; }))); });
      b.push([], ['Batas cair (LL)', '%', r.LL], ['Batas plastis (PL)', '%', r.PL], ['Indeks plastisitas (IP)', '%', r.NP ? 'NP' : r.IP]);
      if (r.klas) b.push(['Simbol bagan plastisitas', '', r.klas.simbol]);
      return b;
    },
    sumber: ['Badan Standardisasi Nasional. SNI 1967:2008 <em>Cara uji penentuan batas cair tanah</em>.',
      'Badan Standardisasi Nasional. SNI 1966:2008 <em>Cara uji penentuan batas plastis dan indeks plastisitas tanah</em>.',
      'Badan Standardisasi Nasional. SNI 6371:2015 <em>Tata cara pengklasifikasian tanah untuk keperluan teknik dengan sistem klasifikasi unifikasi tanah</em>. Garis A dan garis U bagan plastisitas.',
      'ASTM D4318. <em>Standard test methods for liquid limit, plastic limit, and plasticity index of soils</em>. Metode satu titik (β = 0,121).']
  });
})();
