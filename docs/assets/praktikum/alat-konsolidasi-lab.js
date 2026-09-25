/* Definisi alat: uji konsolidasi satu dimensi di laboratorium (e–log p, Cc, Cs, mv, cv metode Taylor). */
(function () {
  'use strict';

  var H = window.HitungKonsolidasiLab, f = Umum.f;
  var WAKTU = [0, 0.1, 0.25, 0.5, 1, 2, 4, 8, 15, 30, 60, 120, 240, 480, 1440];
  // Data contoh dibangkitkan dari teori Terzaghi (cv 3·10⁻³ sampai 1,4·10⁻³ cm²/s), bukan data uji sungguhan.
  var P = [0.25, 0.5, 1, 2, 4, 1, 0.25], AKHIR = [null, null, null, null, null, 301, 275];
  var KOLOM = [[100, 102, 103.5, 105, 107, 109.5, 112, 114, 114, 114, 114.5, 114.5, 114.5, 114.5, 114.5],
    [114.5, 116.5, 118, 119, 121, 124, 127, 129, 129.5, 130, 130, 130, 130, 130, 130],
    [130, 134, 136, 138.5, 142, 147, 153.5, 158.5, 160.5, 160.5, 160.5, 161, 161, 161, 161],
    [161, 169.5, 174, 179.5, 187, 198, 212, 225, 231, 232.5, 232.5, 233, 233, 233.5, 233.5],
    [233.5, 243.5, 249, 255.5, 264.5, 277.5, 294, 310.5, 318.5, 320.5, 320.5, 321, 321, 321.5, 322]];

  function kurvaE(r) {
    var T = r.tahap, pmin = Math.min.apply(null, T.map(function (t) { return t.p; })), pmaks = Math.max.apply(null, T.map(function (t) { return t.p; }));
    var es = T.map(function (t) { return t.e; }).concat([r.awal.e0]);
    var muat = T.filter(function (t) { return t.muat; }), lepas = [T[r.iMaks]].concat(T.filter(function (t) { return !t.muat; }));
    return Grafik.plot({ id: 'elogp', judul: 'Kurva e–log p', x: { min: Math.pow(10, Math.floor(Math.log10(pmin))), max: Math.pow(10, Math.ceil(Math.log10(pmaks * 1.01))), log: true, label: 'Tekanan, p (kg/cm², skala log)' },
      y: { min: Math.floor((Math.min.apply(null, es) - 0.02) * 20) / 20, max: Math.ceil((Math.max.apply(null, es) + 0.02) * 20) / 20, label: 'Angka pori, e' },
      horizontal: [{ y: r.awal.e0, teks: 'e₀ = ' + f(r.awal.e0, 3), rata: 'kanan' }],
      seri: [{ titik: muat.map(function (t) { return [t.p, t.e]; }), penanda: true, warna: 'aksen', label: 'Pembebanan' }]
        .concat(lepas.length > 1 ? [{ titik: lepas.map(function (t) { return [t.p, t.e]; }), penanda: true, warna: 'biru', putus: true, label: 'Pelepasan beban' }] : []) });
  }

  function kurvaAkar(t, satuan, arah) {
    var tay = t.taylor, titik = t.kolom.filter(function (b) { return b.t >= 0; });
    var xs = titik.map(function (b) { return Math.sqrt(b.t); }), ys = titik.map(function (b) { return b.d; });
    var xmaks = Math.max.apply(null, xs);
    if (tay && tay.x90) xmaks = Math.min(xmaks, Math.max(6, Math.ceil(tay.x90 * 2.5)));
    var ymin = Math.min.apply(null, ys), ymaks = Math.max.apply(null, ys), pad = (ymaks - ymin) * 0.08 || 1;
    var seri = [{ titik: titik.map(function (b) { return [Math.sqrt(b.t), b.d]; }), penanda: true, warna: 'aksen' }], tanda = [];
    if (tay) {
      // Garis dalam satuan pemampatan s = arah × d × satuan; kembalikan ke bacaan arloji untuk digambar.
      var keD = function (s) { return s / (arah * satuan); };
      seri.push({ titik: [[0, keD(tay.garis.a)], [xmaks, keD(tay.garis.a + tay.garis.b * xmaks)]], warna: 'teks', tebal: 1.4 });
      seri.push({ titik: [[0, keD(tay.garis.a)], [xmaks, keD(tay.garis.a + tay.garis.b / 1.15 * xmaks)]], warna: 'teks', putus: true, tebal: 1.4 });
      if (tay.x90) tanda.push({ x: tay.x90, y: keD(tay.s90), teks: 't₉₀ = ' + f(tay.t90, 2) + ' menit', posisi: 'kanan' });
    }
    return Grafik.plot({ id: 'akar-' + t.nama, judul: 'Tahap ' + t.nama + ': bacaan terhadap akar waktu', lebar: 470, tinggi: 330, x: { min: 0, max: xmaks, label: '√t (√menit)' },
      y: { min: Math.floor(ymin - pad), max: Math.ceil(ymaks + pad), balik: arah > 0, label: 'Bacaan arloji (divisi)' }, seri: seri, tanda: tanda });
  }

  Praktikum.pasang({
    id: 'konsolidasi-lab', judulEkspor: 'Uji konsolidasi (SNI 2812:2011)',
    parameter: [
      { id: 'Gs', label: 'Berat spesifik, G<sub>s</sub>', dariAlat: { alat: 'berat-spesifik', nama: 'berat spesifik', ambil: function (h) { return h.G; }, d: 3 } },
      { id: 'H0', label: 'Tinggi cincin, H<sub>0</sub>', satuan: 'cm' },
      { id: 'diameter', label: 'Diameter cincin', satuan: 'cm' },
      { id: 'cincin', label: 'Berat cincin', satuan: 'gram' },
      { id: 'cincinBasah', label: 'Berat cincin + tanah basah', satuan: 'gram', bantuan: 'Sebelum pengujian.' },
      { id: 'Ws', label: 'Berat tanah kering', satuan: 'gram', bantuan: 'Setelah pengujian, dari pengeringan oven.' },
      { id: 'satuan', label: 'Satuan arloji', satuan: 'mm/divisi' },
      { id: 'arloji0', label: 'Bacaan arloji awal', satuan: 'divisi', bantuan: 'Sebelum beban pertama.' },
      { id: 'arah', label: 'Arah arloji saat memampat', pilihan: [['naik', 'Bacaan bertambah'], ['turun', 'Bacaan berkurang']] },
      { id: 'drainase', label: 'Drainase', pilihan: [['dua', 'Dua arah (batu pori atas dan bawah)'], ['satu', 'Satu arah']] },
      { id: 'caraCc', label: 'Indeks pemampatan C<sub>c</sub>', pilihan: [['terakhir', 'Dari dua tahap beban tertinggi'], ['maks', 'Dari interval tercuram']] },
      { id: 'LL', label: 'Batas cair, LL', satuan: '%', bantuan: 'Opsional, untuk korelasi C<sub>c</sub> = 0,009 (LL − 10).',
        dariAlat: { alat: 'atterberg', nama: 'Atterberg', ambil: function (h) { return h.LL; }, d: 2 } }],
    tabel: [
      { id: 'tahap', judul: 'Tahap beban', kolom: 'Tahap', awal: 5, min: 2, maks: 12, baris: [
        { id: 'p', label: 'Tekanan', simbol: 'p', satuan: 'kg/cm²' },
        { id: 'akhir', label: 'Bacaan arloji akhir', simbol: 'd', satuan: 'divisi', opsional: true },
        { id: 't90', label: 't<sub>90</sub> manual', simbol: 't<sub>90</sub>', satuan: 'menit', opsional: true }],
        keterangan: 'Bacaan akhir boleh dikosongkan bila bacaan waktu diisi (diambil bacaan terakhir). Tahap pelepasan beban cukup diisi tekanan dan bacaan akhir.' },
      { id: 'bacaan', jenis: 'daftar', judul: 'Bacaan arloji terhadap waktu', namaPendek: 'Bacaan waktu', maks: 40, awal: WAKTU.map(function (t) { return { t: t }; }),
        keterangan: 'Waktu sejak beban tahap itu dipasang. Satu kolom per tahap, mengikuti tabel tahap beban.',
        kolom: [{ id: 't', label: 'Waktu', satuan: 'menit', kunci: true }],
        kolomDari: { tabel: 'tahap', awalan: 'd', label: function (nama) { return 'Tahap ' + nama; }, satuan: 'divisi' } }],
    contoh: { param: { Gs: 2.68, H0: 2, diameter: 6.35, cincin: 45, cincinBasah: 163.5, Ws: 88, satuan: 0.01, arloji0: 100, arah: 'naik', drainase: 'dua', caraCc: 'terakhir', LL: 48 },
      tabel: {
        tahap: P.map(function (p, i) { return { nama: String(i + 1), p: p, akhir: AKHIR[i] }; }),
        bacaan: WAKTU.map(function (t, j) { var o = { t: t }; KOLOM.forEach(function (k, i) { o['d' + i] = k[j]; }); return o; }) } },
    kosong: { param: { Gs: '', H0: '', diameter: '', cincin: '', cincinBasah: '', Ws: '', satuan: 0.01, arloji0: '', arah: 'naik', drainase: 'dua', caraCc: 'terakhir', LL: '' } },
    hitung: function (m) {
      var p = m.param;
      return H.hitung({ Gs: p.Gs, H0: p.H0, diameter: p.diameter, Ws: p.Ws, Ww: p.cincinBasah - p.cincin, satuan: p.satuan, arloji0: p.arloji0, arah: p.arah,
        drainase: p.drainase, caraCc: p.caraCc, LL: p.LL, tahap: m.tabel.tahap, bacaan: m.tabel.bacaan });
    },
    hasil: function (m, r) { return { e0: r.awal.e0, Cc: r.Cc, Cs: r.Cs, cv: r.cvRata }; },
    tampil: function (m, r, U) {
      var p = m.param, h = '', T = r.tahap, a = r.awal, arah = p.arah === 'turun' ? -1 : 1;
      var kartu = [U.kartu('Angka pori awal', f(a.e0, 3), 'e<sub>0</sub>' + (a.Sr ? '; S<sub>r</sub> = ' + f(a.Sr, 1) + '%' : ''))];
      if (r.Cc !== undefined) kartu.push(U.kartu('Indeks pemampatan', f(r.Cc, 3), 'C<sub>c</sub>, tahap ' + r.tahapCc.nama + (r.CcKorelasi ? '; korelasi LL: ' + f(r.CcKorelasi, 3) : '')));
      if (r.Cs !== undefined) kartu.push(U.kartu('Indeks pengembangan', f(r.Cs, 3), 'C<sub>s</sub>; C<sub>s</sub>/C<sub>c</sub> = ' + (r.Cc ? f(r.Cs / r.Cc, 2) : '–')));
      if (r.cvRata) kartu.push(U.kartu('Koefisien konsolidasi', f(r.cvRata * 1000, 3) + ' <small>×10⁻³ cm²/s</small>', 'rata-rata tahap pembebanan; ' + f(r.cvRata * 1e-4 * 365.25 * 86400, 2) + ' m²/tahun'));
      h += U.ringkasan(kartu);
      h += U.grafik(kurvaE(r), 'Kurva angka pori terhadap log tekanan. Garis putus-putus: pelepasan beban.');
      var akar = T.filter(function (t) { return t.muat && t.kolom.length >= 5; });
      if (akar.length) {
        h += '<div class="kisi-grafik">' + akar.map(function (t) {
          return U.grafik(kurvaAkar(t, p.satuan, arah), 'Tahap ' + t.nama + ' (p = ' + f(t.p, 2) + ' kg/cm²). Garis penuh: bagian lurus awal; putus-putus: absis 1,15 kali. ' +
            (t.caraT90 === 'manual' ? 't<sub>90</sub> diisi manual.' : t.taylor && t.taylor.t90 ? 'Perpotongan memberi t<sub>90</sub>.' : 't<sub>90</sub> tidak ditemukan.'));
        }).join('') + '</div>';
      }
      h += '<h3>Tabel hasil tiap tahap</h3>' + U.tabel([{ teks: 'Tahap' }, { teks: 'p (kg/cm²)', angka: true }, { teks: 'Arloji akhir', angka: true }, 'ΔH (cm)', 'H (cm)', 'e', 'C<sub>c</sub> / C<sub>s</sub>', 'm<sub>v</sub> (cm²/kg)', 't<sub>90</sub> (menit)', 'H<sub>dr</sub> (cm)', 'c<sub>v</sub> (cm²/s)', 'k (cm/s)'],
        T.map(function (t) {
          return [t.nama + (t.muat ? '' : ' ↑'), f(t.p, 2), f(t.akhir, 1), f(t.dH, 4), f(t.H, 4), f(t.e, 4), t.Cc !== undefined ? f(t.Cc, 3) : t.Cs !== undefined ? f(t.Cs, 3) : '–',
            t.mv !== undefined ? f(t.mv, 4) : '–', t.t90 ? f(t.t90, 2) + (t.caraT90 === 'manual' ? '*' : '') : '–', t.muat ? f(t.Hdr, 4) : '–',
            t.cv ? t.cv.toExponential(3).replace('.', ',') : '–', t.k ? t.k.toExponential(2).replace('.', ',') : '–'];
        }), null, { angkaMulai: 1 });
      h += '<p class="kecil redup">↑ = tahap pelepasan beban (nilainya C<sub>s</sub>). * = t<sub>90</sub> diisi manual. H<sub>dr</sub> = ' + (p.drainase === 'satu' ? 'tebal rata-rata tahap (drainase satu arah).' : 'setengah tebal rata-rata tahap (drainase dua arah).') + '</p>';
      h += '<h3>Tabel keadaan awal</h3>' + U.tabel(['Besaran', 'Simbol', 'Satuan', 'Nilai'], [
        ['Luas cincin', 'A', 'cm²', f(a.A, 3)], ['Volume cincin', 'V', 'cm³', f(a.V, 3)], ['Berat tanah basah', 'W<sub>b</sub>', 'gram', f(p.cincinBasah - p.cincin, 3)],
        ['Berat tanah kering', 'W<sub>s</sub>', 'gram', f(p.Ws, 3)], ['Kadar air awal', 'w<sub>0</sub>', '%', a.w !== undefined ? f(a.w, 2) : '–'],
        ['Berat isi basah', 'γ', 'g/cm³', a.gamma ? f(a.gamma, 3) : '–'], ['Berat isi kering', 'γ<sub>d</sub>', 'g/cm³', f(a.gammaD, 3)],
        ['Tinggi butiran padat', 'H<sub>s</sub>', 'cm', f(a.Hs, 4)], ['Angka pori awal', 'e<sub>0</sub>', '–', f(a.e0, 4)], ['Derajat kejenuhan', 'S<sub>r</sub>', '%', a.Sr ? f(a.Sr, 2) : '–']]);
      var t1 = T.filter(function (t) { return t.cv; })[0] || T[0];
      h += '<h3>Langkah hitungan</h3>';
      h += U.langkah('Tinggi butiran dan angka pori awal', U.rumus('H_s = \\dfrac{W_s}{G_s\\,\\rho_w\\,A} = \\dfrac{' + U.t(p.Ws, 2) + '}{' + U.t(p.Gs, 3) + '\\times 1\\times' + U.t(a.A, 3) + '} = ' + U.t(a.Hs, 4) + '\\ \\text{cm} \\qquad (1)') +
        U.rumus('e_0 = \\dfrac{H_0}{H_s} - 1 = \\dfrac{' + U.t(p.H0, 3) + '}{' + U.t(a.Hs, 4) + '} - 1 = ' + U.t(a.e0, 4) + ' \\qquad (2)'));
      h += U.langkah('Angka pori tahap ' + t1.nama, U.rumus('\\Delta H = (d - d_0)\\times\\text{satuan} = (' + U.t(t1.akhir, 1) + ' - ' + U.t(p.arloji0, 1) + ')\\times' + U.t(p.satuan, 3) + '\\ \\text{mm} = ' + U.t(t1.dH, 4) + '\\ \\text{cm} \\qquad (3)') +
        U.rumus('e = \\dfrac{H_0 - \\Delta H}{H_s} - 1 = \\dfrac{' + U.t(p.H0, 3) + ' - ' + U.t(t1.dH, 4) + '}{' + U.t(a.Hs, 4) + '} - 1 = ' + U.t(t1.e, 4) + ' \\qquad (4)'));
      if (r.Cc !== undefined) {
        var c = r.tahapCc;
        h += U.langkah('Indeks pemampatan', U.rumus('C_c = \\dfrac{e_1 - e_2}{\\log p_2 - \\log p_1} = \\dfrac{' + U.t(c.eAwal, 4) + ' - ' + U.t(c.e, 4) + '}{\\log ' + U.t(c.p, 2) + ' - \\log ' + U.t(c.pAwal, 2) + '} = ' + U.t(r.Cc, 3) + ' \\qquad (5)') +
          (r.CcKorelasi ? '<p class="ket">Pembanding: C<sub>c</sub> = 0,009 (LL − 10) = 0,009 × (' + f(p.LL, 2) + ' − 10) = ' + f(r.CcKorelasi, 3) + ' (Terzaghi &amp; Peck, 1967), berlaku untuk lempung terkonsolidasi normal dengan kepekaan rendah.</p>' : ''));
      }
      if (r.Cs !== undefined) {
        h += U.langkah('Indeks pengembangan', U.rumus('C_s = \\dfrac{e_{\\text{akhir}} - e_{\\text{maks}}}{\\log p_{\\text{maks}} - \\log p_{\\text{akhir}}} = \\dfrac{' + U.t(r.tahapCs[1].e, 4) + ' - ' + U.t(r.tahapCs[0].e, 4) + '}{\\log ' + U.t(r.tahapCs[0].p, 2) + ' - \\log ' + U.t(r.tahapCs[1].p, 2) + '} = ' + U.t(r.Cs, 3) + ' \\qquad (6)'));
      }
      if (t1.cv) {
        h += U.langkah('Koefisien konsolidasi tahap ' + t1.nama, U.rumus('H_{dr} = ' + (p.drainase === 'satu' ? '\\dfrac{H_1 + H_2}{2}' : '\\dfrac{1}{2}\\cdot\\dfrac{H_1 + H_2}{2}') + ' = ' + U.t(t1.Hdr, 4) + '\\ \\text{cm} \\qquad (7)') +
          U.rumus('c_v = \\dfrac{0{,}848\\,H_{dr}^2}{t_{90}} = \\dfrac{0{,}848\\times' + U.t(t1.Hdr, 4) + '^2}{' + U.t(t1.t90, 2) + '\\times 60} = ' + U.t(t1.cv * 1000, 4) + '\\times10^{-3}\\ \\text{cm}^2/\\text{s} \\qquad (8)') +
          '<p class="ket">Faktor waktu T<sub>v</sub> = 0,848 untuk derajat konsolidasi 90%. H<sub>dr</sub> adalah panjang lintasan drainase: setengah tebal bila air keluar ke atas dan ke bawah, bukan tebal penuh.</p>' +
          (t1.mv ? U.rumus('m_v = \\dfrac{e_1 - e_2}{(1 + e_1)(p_2 - p_1)} = ' + U.t(t1.mv, 4) + '\\ \\text{cm}^2/\\text{kg},\\qquad k = c_v\\,m_v\\,\\gamma_w = ' + U.t(t1.k * 1e7, 3) + '\\times10^{-7}\\ \\text{cm/s} \\qquad (9)') : ''));
      }
      h += '<p class="kecil redup">Tegangan prakonsolidasi (metode Casagrande) dibaca dari kurva e–log p dan butuh cukup banyak tahap pembebanan; tidak dihitung otomatis di sini.</p>';
      return h;
    },
    ekspor: function (m, r) {
      var a = r.awal, b = [['Luas cincin', 'cm2', a.A], ['Tinggi butiran Hs', 'cm', a.Hs], ['Angka pori awal e0', '-', a.e0], [],
        ['Tahap', 'p (kg/cm2)', 'Arloji akhir', 'dH (cm)', 'H (cm)', 'e', 'Cc/Cs', 'mv (cm2/kg)', 't90 (menit)', 'Hdr (cm)', 'cv (cm2/s)', 'k (cm/s)']];
      r.tahap.forEach(function (t) { b.push([t.nama, t.p, t.akhir, t.dH, t.H, t.e, t.Cc !== undefined ? t.Cc : t.Cs !== undefined ? t.Cs : '', t.mv === undefined ? '' : t.mv, t.t90 || '', t.muat ? t.Hdr : '', t.cv || '', t.k || '']); });
      b.push([], ['Cc', '-', r.Cc === undefined ? '' : r.Cc], ['Cs', '-', r.Cs === undefined ? '' : r.Cs], ['cv rata-rata', 'cm2/s', r.cvRata || '']);
      return b;
    },
    sumber: ['Badan Standardisasi Nasional. SNI 2812:2011, uji konsolidasi tanah satu dimensi.',
      'Taylor, D. W. (1948). <em>Fundamentals of soil mechanics</em>. John Wiley &amp; Sons. Metode akar waktu.',
      'Terzaghi, K., &amp; Peck, R. B. (1967). <em>Soil mechanics in engineering practice</em> (2nd ed.). John Wiley &amp; Sons. Korelasi C<sub>c</sub> = 0,009 (LL − 10).',
      'Das, B. M. <em>Principles of geotechnical engineering</em>. Cengage Learning. Kurva e–log p, m<sub>v</sub>, dan c<sub>v</sub>.']
  });
})();
