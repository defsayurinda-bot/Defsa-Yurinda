/* Definisi alat: kuat geser langsung dan kuat tekan bebas. Halaman memilih lewat data-alat. */
(function () {
  'use strict';

  var H = window.HitungKekuatan, f = Umum.f, jenis = document.getElementById('alat-praktikum').dataset.alat;
  var WARNA = ['aksen', 'biru', 'hijau', 'ungu', 'teks'];

  if (jenis === 'geser-langsung') {
    var GESER = [];
    for (var g = 0.25; g <= 6.001; g += 0.25) GESER.push({ geser: Math.round(g * 100) / 100 });
    var DIAL = [
      [5, 8.5, 11, 12.8, 14, 14.8, 15.3, 15.6, 15.5, 15.3, 15.1, 15.0, 14.9, 14.8, 14.8, 14.7],
      [6.5, 11.5, 15.2, 18, 19.8, 21, 21.8, 22.3, 22.5, 22.4, 22.1, 21.9, 21.7, 21.6, 21.5, 21.4],
      [8, 14, 19, 22.8, 25.4, 27.2, 28.3, 29, 29.4, 29.3, 29.1, 28.8, 28.5, 28.3, 28.2, 28.1]];

    Praktikum.pasang({
      id: 'geser-langsung', judulEkspor: 'Pemeriksaan kuat geser langsung (SNI 3420:2016)',
      parameter: [
        { id: 'bentuk', label: 'Bentuk benda uji', pilihan: [['bulat', 'Bulat (cincin)'], ['persegi', 'Persegi']] },
        { id: 'ukuran', label: 'Diameter atau sisi benda uji', satuan: 'cm' },
        { id: 'tinggi', label: 'Tinggi benda uji', satuan: 'cm', bantuan: 'Untuk dicatat di laporan.' },
        { id: 'kalibrasi', label: 'Kalibrasi cincin beban', satuan: 'kg/divisi' },
        { id: 'koreksiLuas', label: 'Luas bidang geser', pilihan: [['tidak', 'Luas awal (seperti form lab)'], ['ya', 'Luas terkoreksi terhadap penggeseran']],
          bantuan: 'Koreksi luas memperhitungkan berkurangnya luas kontak saat kotak bergeser.' }],
      tabel: [
        { id: 'benda', judul: 'Beban normal tiap benda uji', kolom: 'Benda uji', awal: 3, min: 2, maks: 5, baris: [
          { id: 'P', label: 'Gaya normal', simbol: 'P', satuan: 'kg' }] },
        { id: 'bacaan', jenis: 'daftar', judul: 'Bacaan arloji gaya geser', namaPendek: 'Bacaan geser', maks: 60, awal: GESER,
          keterangan: 'Satu kolom per benda uji, mengikuti jumlah kolom di tabel beban normal. Penggeseran dalam mm.',
          kolom: [{ id: 'geser', label: 'Penggeseran', satuan: 'mm', kunci: true }],
          kolomDari: { tabel: 'benda', awalan: 'd', label: function (nama) { return 'Arloji BU ' + nama; }, satuan: 'divisi' } }],
      contoh: { param: { bentuk: 'bulat', ukuran: 6.31, tinggi: 2, kalibrasi: 0.54, koreksiLuas: 'tidak' }, tabel: {
        benda: [{ nama: '1', P: 8 }, { nama: '2', P: 16 }, { nama: '3', P: 24 }],
        bacaan: GESER.map(function (b, i) { var o = { geser: b.geser }; DIAL.forEach(function (d, j) { if (d[i] !== undefined) o['d' + j] = d[i]; }); return o; }) } },
      kosong: { param: { bentuk: 'bulat', ukuran: '', tinggi: '', kalibrasi: '', koreksiLuas: 'tidak' } },
      hitung: function (m) {
        return H.geserLangsung({ bentuk: m.param.bentuk, ukuran: m.param.ukuran, kalibrasi: m.param.kalibrasi, koreksiLuas: m.param.koreksiLuas,
          benda: m.tabel.benda, bacaan: m.tabel.bacaan });
      },
      hasil: function (m, r) { return { c: r.c, phi: r.phi }; },
      tampil: function (m, r, U) {
        var h = '', B = r.benda;
        h += U.ringkasan([U.kartu('Kohesi', f(r.c, 3) + ' <small>kg/cm²</small>', 'c = ' + f(r.c * r.kPa, 1) + ' kPa'),
          U.kartu('Sudut geser dalam', f(r.phi, 2) + ' <small>°</small>', 'φ; tan φ = ' + f(r.tanPhi, 3) + (B.length > 2 ? '; R² = ' + f(r.r2, 3) : ''))]);
        var tmaks = 0, gmaks = 0;
        B.forEach(function (b) { b.kurva.forEach(function (k) { tmaks = Math.max(tmaks, k.tau); gmaks = Math.max(gmaks, k.geser); }); });
        h += U.grafik(Grafik.plot({ id: 'geser', judul: 'Tegangan geser terhadap penggeseran', x: { min: 0, max: Math.ceil(gmaks), label: 'Penggeseran (mm)' },
          y: { min: 0, max: Math.ceil(tmaks * 1.15 * 20) / 20, label: 'Tegangan geser, τ (kg/cm²)' },
          seri: B.map(function (b, i) { return { titik: b.kurva.map(function (k) { return [k.geser, k.tau]; }), penanda: true, warna: WARNA[i], label: 'BU ' + b.nama + ' (σ = ' + f(b.sigma0, 3) + ')' }; }) }),
          'Tegangan geser terhadap penggeseran tiap benda uji. Tegangan puncak dipakai untuk garis keruntuhan.');
        var smaks = Math.max.apply(null, B.map(function (b) { return b.puncak.sigma; })) * 1.25;
        var ymaks = Math.max(tmaks, r.c + r.tanPhi * smaks) * 1.15;
        h += U.grafik(Grafik.plot({ id: 'mohr', judul: 'Garis keruntuhan Mohr–Coulomb', x: { min: 0, max: Math.ceil(smaks * 10) / 10, label: 'Tegangan normal, σ (kg/cm²)' },
          y: { min: 0, max: Math.ceil(ymaks * 20) / 20, label: 'Tegangan geser, τ (kg/cm²)' },
          seri: [{ titik: [[0, r.c], [smaks, r.c + r.tanPhi * smaks]], warna: 'teks', label: 'τ = ' + f(r.c, 3) + ' + σ tan ' + f(r.phi, 1) + '°' },
            { titik: B.map(function (b) { return [b.puncak.sigma, b.puncak.tau]; }), garis: false, penanda: true, warna: 'aksen' }],
          tanda: B.map(function (b) { return { x: b.puncak.sigma, y: b.puncak.tau, teks: 'BU ' + b.nama, posisi: 'kanan', titik: false, atas: true }; }) }),
          'Garis keruntuhan dari tegangan geser puncak dengan kuadrat terkecil.');
        h += '<h3>Tabel hasil tiap benda uji</h3>' + U.tabel(['Uraian', 'Simbol', 'Satuan'].concat(B.map(function (b) { return 'BU ' + U.esc(b.nama); })), [
          ['Gaya normal', 'P', 'kg'].concat(B.map(function (b) { return f(b.P, 2); })),
          ['Tegangan normal', 'σ', 'kg/cm²'].concat(B.map(function (b) { return f(b.puncak.sigma, 3); })),
          ['Bacaan arloji puncak', '', 'divisi'].concat(B.map(function (b) { return f(b.puncak.bacaan, 1); })),
          ['Gaya geser puncak', 'T', 'kg'].concat(B.map(function (b) { return f(b.puncak.gaya, 3); })),
          ['Penggeseran saat puncak', 'δ', 'mm'].concat(B.map(function (b) { return f(b.puncak.geser, 2); })),
          ['Luas bidang geser', 'A', 'cm²'].concat(B.map(function (b) { return f(b.puncak.A, 3); })),
          ['Tegangan geser puncak', 'τ<sub>f</sub>', 'kg/cm²'].concat(B.map(function (b) { return f(b.puncak.tau, 3); })),
          ['Tegangan geser puncak', 'τ<sub>f</sub>', 'kPa'].concat(B.map(function (b) { return f(b.puncak.tau * r.kPa, 2); }))]);
        var b0 = B[0], p0 = b0.puncak;
        h += '<h3>Langkah hitungan</h3>';
        h += U.langkah('Luas dan tegangan normal (BU ' + b0.nama + ')', U.rumus((m.param.bentuk === 'persegi' ? 'A = B^2 = ' + U.t(m.param.ukuran, 2) + '^2' : 'A = \\tfrac{1}{4}\\pi D^2 = \\tfrac{1}{4}\\pi\\times' + U.t(m.param.ukuran, 2) + '^2') + ' = ' + U.t(r.A0, 3) + '\\ \\text{cm}^2 \\qquad (1)') +
          U.rumus('\\sigma = \\dfrac{P}{A} = \\dfrac{' + U.t(b0.P, 2) + '}{' + U.t(p0.A, 3) + '} = ' + U.t(p0.sigma, 3) + '\\ \\text{kg/cm}^2 \\qquad (2)') +
          (m.param.koreksiLuas === 'ya' ? '<p class="ket">Luas terkoreksi pada penggeseran ' + f(p0.geser, 2) + ' mm: ' + (m.param.bentuk === 'persegi' ? 'A<sub>c</sub> = B (B − δ).' : 'A<sub>c</sub> = (D²/2)(θ − sin θ cos θ), θ = arccos(δ/D).') + '</p>' : ''));
        h += U.langkah('Tegangan geser puncak', U.rumus('T = \\text{bacaan}\\times\\text{kalibrasi} = ' + U.t(p0.bacaan, 1) + '\\times' + U.t(m.param.kalibrasi, 3) + ' = ' + U.t(p0.gaya, 3) + '\\ \\text{kg} \\qquad (3)') +
          U.rumus('\\tau_f = \\dfrac{T}{A} = \\dfrac{' + U.t(p0.gaya, 3) + '}{' + U.t(p0.A, 3) + '} = ' + U.t(p0.tau, 3) + '\\ \\text{kg/cm}^2 \\qquad (4)'));
        h += U.langkah('Parameter kuat geser', U.rumus('\\tau_f = c + \\sigma\\tan\\varphi \\qquad (5)') +
          U.rumus('\\tan\\varphi = ' + U.t(r.tanPhi, 4) + '\\ \\Rightarrow\\ \\varphi = ' + U.t(r.phi, 2) + '^{\\circ},\\qquad c = ' + U.t(r.c, 3) + '\\ \\text{kg/cm}^2 = ' + U.t(r.c * r.kPa, 1) + '\\ \\text{kPa}') +
          '<p class="ket">c dan tan φ dari kuadrat terkecil ' + B.length + ' titik (σ, τ<sub>f</sub>). 1 kg/cm² = 98,0665 kPa.</p>');
        return h;
      },
      ekspor: function (m, r) {
        var B = r.benda, b = [['Diameter/sisi', 'cm', m.param.ukuran], ['Luas awal', 'cm2', r.A0], ['Kalibrasi', 'kg/div', m.param.kalibrasi], [],
          ['Penggeseran (mm)'].concat(B.map(function (x) { return 'Arloji BU ' + x.nama; })).concat(B.map(function (x) { return 'Tau BU ' + x.nama + ' (kg/cm2)'; }))];
        m.tabel.bacaan.forEach(function (row) {
          var k = B.map(function (x) { return x.kurva.filter(function (q) { return q.geser === row.geser; })[0]; });
          b.push([row.geser].concat(k.map(function (q) { return q ? q.bacaan : ''; })).concat(k.map(function (q) { return q ? q.tau : ''; })));
        });
        b.push([], ['Benda uji', 'P (kg)', 'Sigma (kg/cm2)', 'Tau puncak (kg/cm2)']);
        B.forEach(function (x) { b.push([x.nama, x.P, x.puncak.sigma, x.puncak.tau]); });
        b.push([], ['Kohesi c', 'kg/cm2', r.c], ['Sudut geser dalam', 'derajat', r.phi]);
        return b;
      },
      sumber: ['Badan Standardisasi Nasional. SNI 3420:2016, uji kuat geser langsung tanah (nomor standar sesuai form laboratorium).',
        'Das, B. M. <em>Principles of geotechnical engineering</em>. Cengage Learning. Kriteria keruntuhan Mohr–Coulomb.']
    });
  }

  if (jenis === 'tekan-bebas') {
    var CONTOH = [[0, 0, 0], [0.5, 25, 6], [1, 50, 11], [1.5, 75, 15.5], [2, 100, 19], [3, 150, 24], [4, 200, 27.5], [5, 250, 29.5], [6, 300, 30.8], [7, 350, 31.5],
      [8, 400, 31.8], [9, 450, 31.6], [10, 500, 31.0], [12, 600, 29.8], [14, 700, 28.5], [16, 800, 27.3]];
    Praktikum.pasang({
      id: 'tekan-bebas', judulEkspor: 'Pemeriksaan kuat tekan bebas (SNI 3638:2012)',
      parameter: [
        { id: 'diameter', label: 'Diameter benda uji', satuan: 'cm' },
        { id: 'tinggi', label: 'Tinggi benda uji', satuan: 'cm' },
        { id: 'satuanRegangan', label: 'Satuan arloji regangan', satuan: 'mm/divisi', bantuan: 'Umumnya 0,01 mm per divisi.' },
        { id: 'satuanBeban', label: 'Satuan kalibrasi cincin', pilihan: [['kg', 'kg per divisi'], ['kN', 'kN per divisi']] },
        { id: 'kalibrasi', label: 'Kalibrasi cincin beban', satuan: 'per divisi' },
        { id: 'berat', label: 'Berat benda uji', satuan: 'gram', bantuan: 'Opsional, untuk berat isi.' },
        { id: 'w', label: 'Kadar air', satuan: '%', bantuan: 'Opsional, untuk berat isi kering.', dariAlat: { alat: 'kadar-air', nama: 'kadar air', ambil: function (h) { return h.w; }, d: 2 } },
        { id: 'quRemas', label: 'q<sub>u</sub> contoh teremas', satuan: 'kPa', bantuan: 'Opsional, untuk sensitivitas.' }],
      tabel: [{ id: 'bacaan', jenis: 'daftar', judul: 'Bacaan pengujian', namaPendek: 'Bacaan', maks: 60, awal: 16,
        keterangan: 'Bacaan arloji regangan (pemendekan) dan arloji cincin beban. Waktu hanya untuk catatan.',
        kolom: [{ id: 't', label: 'Waktu', satuan: 'menit', opsional: true }, { id: 'regangan', label: 'Arloji regangan', satuan: 'divisi' }, { id: 'beban', label: 'Arloji beban', satuan: 'divisi' }] }],
      contoh: { param: { diameter: 3.8, tinggi: 7.6, satuanRegangan: 0.01, satuanBeban: 'kN', kalibrasi: 0.0045, berat: 162, w: 28, quRemas: 42 },
        tabel: { bacaan: CONTOH.map(function (b) { return { t: b[0], regangan: b[1], beban: b[2] }; }) } },
      kosong: { param: { diameter: '', tinggi: '', satuanRegangan: 0.01, satuanBeban: 'kg', kalibrasi: '', berat: '', w: '', quRemas: '' } },
      hitung: function (m) {
        var p = m.param;
        return H.tekanBebas({ diameter: p.diameter, tinggi: p.tinggi, satuanRegangan: p.satuanRegangan, satuanBeban: p.satuanBeban, kalibrasi: p.kalibrasi,
          berat: p.berat, w: p.w, quRemas: p.quRemas, bacaan: m.tabel.bacaan });
      },
      hasil: function (m, r) { return { qu: r.quKPa, cu: r.cuKPa }; },
      tampil: function (m, r, U) {
        var p = m.param, h = '', T = r.titik, sat = p.satuanBeban === 'kN' ? 'kN/cm²' : 'kg/cm²', dS = p.satuanBeban === 'kN' ? 5 : 3;
        var kartu = [U.kartu('Kuat tekan bebas', f(r.quKPa, 1) + ' <small>kPa</small>', 'q<sub>u</sub> = ' + f(r.qu, dS) + ' ' + sat + ' (' + r.caraQu + ')'),
          U.kartu('Kohesi tak terdrainase', f(r.cuKPa, 1) + ' <small>kPa</small>', 'c<sub>u</sub> = q<sub>u</sub>/2 · ' + r.konsistensi.toLowerCase())];
        if (r.St) kartu.push(U.kartu('Sensitivitas', f(r.St, 2), 'S<sub>t</sub> = q<sub>u</sub> / q<sub>u,teremas</sub>'));
        if (r.E50) kartu.push(U.kartu('Modulus sekan', f(r.E50 / 1000, 2) + ' <small>MPa</small>', 'E<sub>50</sub> pada ε = ' + f(r.eps50, 2) + '%'));
        h += U.ringkasan(kartu);
        var emaks = Math.max(16, Math.ceil(T[T.length - 1].eps / 2) * 2), smaks = Math.max.apply(null, T.map(function (t) { return t.kPa; }));
        h += U.grafik(Grafik.plot({ id: 'ucs', judul: 'Kurva tegangan regangan', x: { min: 0, max: emaks, label: 'Regangan aksial, ε (%)' },
          y: { min: 0, max: Math.ceil(smaks * 1.2 / 10) * 10, label: 'Tegangan, σ (kPa)' },
          seri: [{ titik: T.map(function (t) { return [t.eps, t.kPa]; }), penanda: true, warna: 'aksen' }],
          vertikal: [{ x: 15, teks: 'ε = 15%' }], horizontal: [{ y: r.quKPa / 2, teks: 'qu/2' }],
          tanda: [{ x: r.epsQu, y: r.quKPa, teks: 'qu = ' + f(r.quKPa, 1) + ' kPa', posisi: r.epsQu > emaks * 0.6 ? 'kiri' : 'kanan', atas: true }] }),
          'Kurva tegangan terhadap regangan aksial dengan koreksi luas. Garis putus-putus mendatar: q<sub>u</sub>/2 untuk E<sub>50</sub>.');
        h += '<h3>Tabel hasil</h3>' + U.tabel([{ teks: 'Arloji regangan' }, { teks: 'ΔL (cm)', angka: true }, { teks: 'ε (%)', angka: true }, 'Arloji beban', 'P (' + (p.satuanBeban === 'kN' ? 'kN' : 'kg') + ')', 'A terkoreksi (cm²)', 'σ (' + sat + ')', 'σ (kPa)'],
          T.map(function (t) { return [f(t.regangan, 0), f(t.dL, 4), f(t.eps, 2), f(t.beban, 1), f(t.P, p.satuanBeban === 'kN' ? 4 : 3), f(t.A, 3), f(t.sigma, dS), f(t.kPa, 2)]; }), null, { angkaMulai: 0 });
        var t1 = r.puncak;
        h += '<h3>Langkah hitungan (titik puncak)</h3>';
        h += U.langkah('Luas awal', U.rumus('A_0 = \\tfrac{1}{4}\\pi D^2 = \\tfrac{1}{4}\\pi\\times' + U.t(p.diameter, 2) + '^2 = ' + U.t(r.A0, 3) + '\\ \\text{cm}^2 \\qquad (1)'));
        h += U.langkah('Regangan dan luas terkoreksi', U.rumus('\\varepsilon = \\dfrac{\\Delta L}{L_0} = \\dfrac{' + U.t(t1.dL, 4) + '}{' + U.t(p.tinggi, 2) + '} = ' + U.t(t1.eps, 2) + '\\% \\qquad (2)') +
          U.rumus('A = \\dfrac{A_0}{1 - \\varepsilon} = \\dfrac{' + U.t(r.A0, 3) + '}{1 - ' + U.t(t1.eps / 100, 4) + '} = ' + U.t(t1.A, 3) + '\\ \\text{cm}^2 \\qquad (3)') +
          '<p class="ket">ΔL = (bacaan − bacaan awal) × ' + f(p.satuanRegangan, 3) + ' mm. Regangan dihitung dari perubahan panjang, bukan bacaan dikali tinggi.</p>');
        h += U.langkah('Tegangan dan kuat tekan bebas', U.rumus('\\sigma = \\dfrac{P}{A} = \\dfrac{' + U.t(t1.P, 4) + '}{' + U.t(t1.A, 3) + '} = ' + U.t(t1.sigma, dS) + '\\ \\text{' + sat + '} = ' + U.t(t1.kPa, 1) + '\\ \\text{kPa} \\qquad (4)') +
          U.rumus('c_u = \\dfrac{q_u}{2} = \\dfrac{' + U.t(r.quKPa, 1) + '}{2} = ' + U.t(r.cuKPa, 1) + '\\ \\text{kPa} \\qquad (5)') +
          '<p class="ket">' + (r.caraQu === 'puncak' ? 'q<sub>u</sub> = tegangan puncak pada regangan ≤ 15%.' : 'Tegangan belum mencapai puncak sampai regangan 15%, jadi q<sub>u</sub> diambil pada ε = 15%.') +
          ' Konsistensi <strong>' + r.konsistensi.toLowerCase() + '</strong> menurut rentang q<sub>u</sub> (Das).</p>');
        if (r.gamma) h += U.langkah('Berat isi', U.rumus('\\gamma = \\dfrac{W}{A_0 L_0} = \\dfrac{' + U.t(p.berat, 2) + '}{' + U.t(r.A0, 3) + '\\times' + U.t(p.tinggi, 2) + '} = ' + U.t(r.gamma, 3) + '\\ \\text{g/cm}^3 \\qquad (6)') +
          (r.gammaD ? U.rumus('\\gamma_d = \\dfrac{\\gamma}{1 + w} = ' + U.t(r.gammaD, 3) + '\\ \\text{g/cm}^3') : ''));
        return h;
      },
      ekspor: function (m, r) {
        var b = [['Diameter', 'cm', m.param.diameter], ['Tinggi', 'cm', m.param.tinggi], ['Luas awal', 'cm2', r.A0], [],
          ['Arloji regangan', 'dL (cm)', 'Regangan (%)', 'Arloji beban', 'P', 'A (cm2)', 'Sigma', 'Sigma (kPa)']];
        r.titik.forEach(function (t) { b.push([t.regangan, t.dL, t.eps, t.beban, t.P, t.A, t.sigma, t.kPa]); });
        b.push([], ['qu', 'kPa', r.quKPa], ['cu', 'kPa', r.cuKPa], ['Konsistensi', '', r.konsistensi]);
        if (r.St) b.push(['Sensitivitas', '-', r.St]);
        if (r.E50) b.push(['E50', 'kPa', r.E50]);
        return b;
      },
      sumber: ['Badan Standardisasi Nasional. SNI 3638:2012, uji kuat tekan bebas tanah kohesif. Berdasarkan ASTM D2166.',
        'ASTM D2166. <em>Standard test method for unconfined compressive strength of cohesive soil</em>. Koreksi luas dan batas regangan 15%.',
        'Das, B. M. <em>Principles of geotechnical engineering</em>. Cengage Learning. Hubungan konsistensi lempung dan q<sub>u</sub>.']
    });
  }
})();
