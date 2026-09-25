/* Definisi alat: klasifikasi tanah USCS (SNI 6371:2015) dan AASHTO M 145 dari data gradasi dan Atterberg. */
(function () {
  'use strict';

  var H = window.HitungKlasifikasi, HA = window.HitungAtterberg, f = Umum.f;

  function adaNilai(v) { return v !== null && v !== undefined && isFinite(v); }
  // Nilai yang diambil dari alat lain dibulatkan: persen 2 desimal, diameter 4 desimal.
  function p2(v) { return adaNilai(v) ? Math.round(v * 100) / 100 : null; }
  function d4(v) { return adaNilai(v) ? Math.round(v * 1e4) / 1e4 : null; }
  function gradasi(h) { return { P4: p2(h.P4), P10: p2(h.P10), P40: p2(h.P40), P200: p2(h.P200), D10: d4(h.D10), D30: d4(h.D30), D60: d4(h.D60) }; }

  function komposisi(r) {
    var bagian = [['Kerikil', r.G, 'var(--lempung)'], ['Pasir', r.S, 'var(--pasir)'], ['Butir halus', r.F, 'var(--teks-2)']];
    var x = 20, s = '<svg class="grafik" viewBox="0 0 900 84" role="img" aria-label="Komposisi butir">';
    bagian.forEach(function (b) {
      var w = 860 * b[1] / 100;
      if (w > 0.5) s += '<rect x="' + x + '" y="14" width="' + w + '" height="30" style="fill:' + b[2] + ';stroke:var(--permukaan);stroke-width:1.5"/>';
      x += w;
    });
    x = 20;
    bagian.forEach(function (b, i) {
      s += '<rect x="' + (20 + i * 220) + '" y="60" width="12" height="12" rx="2" style="fill:' + b[2] + '"/><text x="' + (38 + i * 220) + '" y="71" font-size="13" style="fill:var(--teks)">' +
        b[0] + ' ' + f(b[1], 1) + '%</text>';
    });
    return s + '</svg>';
  }

  function baganUSCS(r) {
    var LLm = Math.max(100, Math.ceil((r.LL + 10) / 10) * 10), IPm = Math.max(60, Math.ceil((r.IP + 10) / 10) * 10);
    return Grafik.plot({ id: 'uscs', judul: 'Bagan plastisitas', x: { min: 0, max: LLm, label: 'Batas cair, LL (%)' }, y: { min: 0, max: IPm, label: 'Indeks plastisitas, IP (%)' },
      area: [{ titik: [[25.48, 4], [29.59, 7], [7 / 0.9 + 8, 7], [4 / 0.9 + 8, 4]], warna: 'teks' }],
      seri: [{ titik: [[20, 0], [LLm, HA.garisA(LLm)]], warna: 'teks', label: 'Garis A' }, { titik: [[8, 0], [LLm, HA.garisU(LLm)]], warna: 'redup', putus: true, label: 'Garis U' }],
      vertikal: [{ x: 50 }],
      tanda: [[44, 27, 'CL'], [70, 48, 'CH'], [42, 6, 'ML'], [80, 22, 'MH']]
        .filter(function (z) { return Math.abs(z[0] - r.LL) > 7 || Math.abs(z[1] - r.IP) > 5; })
        .map(function (z) { return { x: z[0], y: z[1], teks: z[2], titik: false }; })
        .concat([{ x: r.LL, y: r.IP, teks: 'butir halus (' + f(r.LL, 1) + '; ' + f(r.IP, 1) + ')', posisi: r.LL > LLm * 0.6 ? 'kiri' : 'kanan' }]) });
  }

  // Rentang LL dan IP kelompok A-2, A-4 sampai A-7 (batas LL 40/41 dan IP 10/11, garis IP = LL − 30).
  function baganAASHTO(a) {
    var LLm = Math.max(100, Math.ceil((a.LL + 10) / 10) * 10), IPm = Math.max(60, Math.ceil((a.IP + 10) / 10) * 10);
    return Grafik.plot({ id: 'aashto', judul: 'Rentang LL dan IP AASHTO', x: { min: 0, max: LLm, label: 'Batas cair, LL (%)' }, y: { min: 0, max: IPm, label: 'Indeks plastisitas, IP (%)' },
      seri: [{ titik: [[40.5, 0], [40.5, IPm]], warna: 'teks', tebal: 1.6 }, { titik: [[0, 10.5], [LLm, 10.5]], warna: 'teks', tebal: 1.6 },
        { titik: [[40.5, 10.5], [LLm, LLm - 30]], warna: 'teks', tebal: 1.6 }],
      tanda: [[8, 5, 'A-4 / A-2-4'], [52, 5, 'A-5 / A-2-5'], [8, 30, 'A-6 / A-2-6'], [72, 24, 'A-7-5'], [46, 46, 'A-7-6']]
        .filter(function (z) { return Math.abs(z[0] + 8 - a.LL) > 10 || Math.abs(z[1] - a.IP) > 5; })
        .map(function (z) { return { x: z[0], y: z[1], teks: z[2], titik: false }; })
        .concat([{ x: a.LL, y: a.IP, teks: a.kelompok + ' (' + a.GI + ')', posisi: a.LL > LLm * 0.6 ? 'kiri' : 'kanan', atas: a.IP < 6 }]) });
  }

  Praktikum.pasang({
    id: 'klasifikasi', judulEkspor: 'Klasifikasi tanah (SNI 6371:2015 dan AASHTO M 145)',
    impor: [
      { alat: 'saringan', nama: 'Analisa saringan', isi: gradasi },
      { alat: 'hidrometer', nama: 'Hidrometer (kurva gabungan)', isi: gradasi },
      { alat: 'atterberg', nama: 'Batas Atterberg', isi: function (h) { return h.NP ? { plastisitas: 'NP' } : { plastisitas: 'plastis', LL: p2(h.LL), PL: p2(h.PL) }; } }],
    parameter: [
      { id: 'P4', label: 'Lolos No. 4 (4,75 mm)', satuan: '%' },
      { id: 'P10', label: 'Lolos No. 10 (2,00 mm)', satuan: '%', bantuan: 'Untuk AASHTO bila lolos No. 200 ≤ 15%.' },
      { id: 'P40', label: 'Lolos No. 40 (0,425 mm)', satuan: '%', bantuan: 'Untuk AASHTO bila lolos No. 200 ≤ 35%.' },
      { id: 'P200', label: 'Lolos No. 200 (0,075 mm)', satuan: '%' },
      { id: 'D10', label: 'D<sub>10</sub>', satuan: 'mm', bantuan: 'D10, D30, D60 wajib bila butir halus < 12%.' },
      { id: 'D30', label: 'D<sub>30</sub>', satuan: 'mm' },
      { id: 'D60', label: 'D<sub>60</sub>', satuan: 'mm' },
      { id: 'plastisitas', label: 'Butir halus', pilihan: [['plastis', 'Plastis (ada LL dan PL)'], ['NP', 'Nonplastis (NP)']] },
      { id: 'LL', label: 'Batas cair, LL', satuan: '%', tampilJika: function (p) { return p.plastisitas !== 'NP'; } },
      { id: 'PL', label: 'Batas plastis, PL', satuan: '%', tampilJika: function (p) { return p.plastisitas !== 'NP'; } }],
    tabel: [],
    contoh: { param: { P4: 94.2, P10: 81.5, P40: 58.3, P200: 41.7, D10: '', D30: '', D60: 0.21, plastisitas: 'plastis', LL: 36.4, PL: 21.8 }, tabel: {} },
    kosong: { param: { P4: '', P10: '', P40: '', P200: '', D10: '', D30: '', D60: '', plastisitas: 'plastis', LL: '', PL: '' } },
    hitung: function (m) {
      var p = m.param, NP = p.plastisitas === 'NP';
      var u = H.uscs({ P4: p.P4, P200: p.P200, D10: p.D10, D30: p.D30, D60: p.D60, LL: NP ? NaN : p.LL, PL: NP ? NaN : p.PL, NP: NP });
      var a = H.aashto({ P10: p.P10, P40: p.P40, P200: p.P200, LL: NP ? NaN : p.LL, PL: NP ? NaN : p.PL, NP: NP });
      if (u.galat.length) return { galat: u.galat };
      var r = { galat: [], peringatan: u.peringatan.slice(), u: u, a: a.galat.length ? null : a };
      if (a.galat.length) r.peringatan.push('AASHTO belum bisa ditentukan: ' + a.galat.join(' '));
      return r;
    },
    hasil: function (m, r) { return { uscs: r.u.simbol, aashto: r.a ? r.a.kelompok : null, GI: r.a ? r.a.GI : null }; },
    tampil: function (m, r, U) {
      var u = r.u, a = r.a, p = m.param, h = '';
      h += U.ringkasan([U.kartu('USCS (SNI 6371:2015)', u.simbol, u.namaId + '<br><em>' + u.nama + '</em>'),
        U.kartu('AASHTO M 145', a ? a.kelompok + ' <small>(' + a.GI + ')</small>' : '–', a ? a.bahan + '; tanah dasar ' + a.nilaiTanahDasar.toLowerCase() : 'data belum lengkap')]);
      h += U.grafik(komposisi(u), 'Komposisi butir: kerikil > 4,75 mm, pasir 4,75–0,075 mm, butir halus < 0,075 mm.');
      if (u.jenisHalus && !u.NP) h += U.grafik(baganUSCS(u), 'Posisi butir halus di bagan plastisitas SNI 6371:2015. Area berarsir: zona CL-ML.');
      if (a && !a.NP) h += U.grafik(baganAASHTO(a), 'Rentang batas cair dan indeks plastisitas kelompok AASHTO. Angka dalam kurung adalah indeks kelompok.');

      // Jalur keputusan USCS
      var jalur = [];
      jalur.push('Butir halus F = ' + f(u.F, 2) + '% ' + (u.F >= 50 ? '≥ 50%, jadi tanah <strong>berbutir halus</strong>.' : '< 50%, jadi tanah <strong>berbutir kasar</strong>.'));
      if (u.F < 50) {
        jalur.push('Kerikil G = 100 − ' + f(p.P4, 2) + ' = ' + f(u.G, 2) + '%; pasir S = ' + f(p.P4, 2) + ' − ' + f(u.F, 2) + ' = ' + f(u.S, 2) + '%. ' +
          (u.kelompok === 'kerikil' ? 'G > S, jadi <strong>kerikil</strong> (G).' : 'S ≥ G, jadi <strong>pasir</strong> (S).'));
        if (u.gradasi) {
          jalur.push('C<sub>u</sub> = ' + f(u.Cu, 2) + ', C<sub>c</sub> = ' + f(u.Cc, 2) + '. Syarat gradasi baik ' + (u.kelompok === 'kerikil' ? 'C<sub>u</sub> ≥ 4' : 'C<sub>u</sub> ≥ 6') +
            ' dan 1 ≤ C<sub>c</sub> ≤ 3 ' + (u.gradasi === 'W' ? 'terpenuhi (W).' : 'tidak terpenuhi (P).'));
        }
        if (u.F < 5) jalur.push('F < 5%: simbol tunggal.');
        else if (u.F <= 12) jalur.push('5% ≤ F ≤ 12%: <strong>simbol ganda</strong>. Butir halus ' + (u.NP ? 'nonplastis' : 'di zona ' + u.jenisHalus) + ', jadi akhiran ' + u.simbol.slice(-1) + '.');
        else jalur.push('F > 12%: simbol dari jenis butir halus (' + (u.NP ? 'nonplastis → M' : u.jenisHalus) + ').');
        jalur.push((u.kelompok === 'kerikil' ? 'Pasir' : 'Kerikil') + ' ' + f(u.kelompok === 'kerikil' ? u.S : u.G, 2) + '% ' +
          ((u.kelompok === 'kerikil' ? u.S : u.G) >= 15 ? '≥ 15%, jadi nama diberi tambahan "dengan ' + (u.kelompok === 'kerikil' ? 'pasir' : 'kerikil') + '".' : '< 15%, tanpa tambahan nama.'));
      } else {
        jalur.push(u.NP ? 'Nonplastis: butir halus dianggap ML.' : 'LL = ' + f(u.LL, 2) + '%, IP = ' + f(u.IP, 2) + '%. Garis A pada LL ini: IP = 0,73 (' + f(u.LL, 2) + ' − 20) = ' + f(HA.garisA(u.LL), 2) + '%, jadi simbol <strong>' + u.simbol + '</strong>.');
        jalur.push('Tertahan No. 200 = ' + f(100 - u.F, 2) + '% (kerikil ' + f(u.G, 2) + '%, pasir ' + f(u.S, 2) + '%): ' +
          (100 - u.F < 15 ? 'kurang dari 15%, tanpa tambahan nama.' : 100 - u.F < 30 ? '15–30%, tambahan "dengan pasir/kerikil".' : '≥ 30%, nama diberi sifat berpasir/berkerikil.'));
      }
      h += '<h3>Langkah klasifikasi USCS</h3><ol class="langkah-daftar">' + jalur.map(function (j) { return '<li>' + j + '</li>'; }).join('') + '</ol>' +
        '<p>Hasil: <strong>' + u.simbol + '</strong>, ' + u.namaId.toLowerCase() + ' (<em>' + u.nama + '</em>).</p>';

      if (a) {
        var jalurA = ['Lolos No. 200 = ' + f(a.F, 2) + '% ' + (a.granular ? '≤ 35%, jadi <strong>bahan berbutir</strong> (A-1, A-2, A-3).' : '> 35%, jadi <strong>bahan lanau–lempung</strong> (A-4 sampai A-7).'),
          'LL dan IP dibulatkan: LL = ' + (a.NP ? 'NP' : a.LL) + ', IP = ' + (a.NP ? 'NP' : a.IP) + '. Kelompok dicari dari kiri ke kanan tabel; yang pertama cocok adalah <strong>' + a.kelompok + '</strong>.'];
        if (a.kelompok === 'A-7-5' || a.kelompok === 'A-7-6') jalurA.push('LL − 30 = ' + (a.LL - 30) + '; IP ' + (a.kelompok === 'A-7-5' ? '≤' : '>') + ' LL − 30, jadi ' + a.kelompok + '.');
        h += '<h3>Langkah klasifikasi AASHTO</h3><ol class="langkah-daftar">' + jalurA.map(function (j) { return '<li>' + j + '</li>'; }).join('') + '</ol>';
        if (['A-1-a', 'A-1-b', 'A-3', 'A-2-4', 'A-2-5'].indexOf(a.kelompok) >= 0) {
          h += U.langkah('Indeks kelompok', '<p>Untuk kelompok ' + a.kelompok + ', indeks kelompok selalu 0.</p>');
        } else if (a.kelompok === 'A-2-6' || a.kelompok === 'A-2-7') {
          h += U.langkah('Indeks kelompok (hanya suku IP)', U.rumus('GI = 0{,}01\\,(F - 15)(IP - 10) = 0{,}01\\,(' + U.t(a.F, 2) + ' - 15)(' + a.IP + ' - 10) = ' + U.t(a.GImentah, 2)) +
            '<p class="ket">Dibulatkan; nilai negatif dianggap 0. GI = <strong>' + a.GI + '</strong>.</p>');
        } else {
          h += U.langkah('Indeks kelompok', U.rumus('GI = (F - 35)\\,[0{,}2 + 0{,}005\\,(LL - 40)] + 0{,}01\\,(F - 15)(IP - 10)') +
            U.rumus('GI = (' + U.t(a.F, 2) + ' - 35)\\,[0{,}2 + 0{,}005\\,(' + a.LL + ' - 40)] + 0{,}01\\,(' + U.t(a.F, 2) + ' - 15)(' + a.IP + ' - 10) = ' + U.t(a.GImentah, 2)) +
            '<p class="ket">Dibulatkan ke bilangan bulat; nilai negatif dianggap 0. GI = <strong>' + a.GI + '</strong>. Makin besar GI, makin buruk mutu tanah sebagai tanah dasar.</p>');
        }
      }
      h += '<h3>Data yang dipakai</h3>' + U.tabel(['Besaran', 'Simbol', 'Satuan', 'Nilai'], [
        ['Lolos No. 4', 'P<sub>4</sub>', '%', f(p.P4, 2)], ['Lolos No. 10', 'P<sub>10</sub>', '%', adaNilai(p.P10) ? f(p.P10, 2) : '–'],
        ['Lolos No. 40', 'P<sub>40</sub>', '%', adaNilai(p.P40) ? f(p.P40, 2) : '–'], ['Lolos No. 200', 'F', '%', f(p.P200, 2)],
        ['D<sub>10</sub> / D<sub>30</sub> / D<sub>60</sub>', '', 'mm', [p.D10, p.D30, p.D60].map(function (d) { return adaNilai(d) ? f(d, 3) : '–'; }).join(' / ')],
        ['Koefisien keseragaman', 'C<sub>u</sub>', '–', u.Cu ? f(u.Cu, 2) : '–'], ['Koefisien kelengkungan', 'C<sub>c</sub>', '–', u.Cc ? f(u.Cc, 2) : '–'],
        ['Batas cair', 'LL', '%', u.NP ? 'NP' : f(p.LL, 2)], ['Batas plastis', 'PL', '%', u.NP ? 'NP' : f(p.PL, 2)], ['Indeks plastisitas', 'IP', '%', u.NP ? 'NP' : f(u.IP, 2)]]);
      return h;
    },
    ekspor: function (m, r) {
      var p = m.param, u = r.u, a = r.a;
      return [['Besaran', 'Satuan', 'Nilai'], ['Lolos No. 4', '%', p.P4], ['Lolos No. 10', '%', p.P10], ['Lolos No. 40', '%', p.P40], ['Lolos No. 200', '%', p.P200],
        ['D10', 'mm', p.D10], ['D30', 'mm', p.D30], ['D60', 'mm', p.D60], ['Cu', '-', u.Cu], ['Cc', '-', u.Cc],
        ['LL', '%', u.NP ? 'NP' : p.LL], ['PL', '%', u.NP ? 'NP' : p.PL], ['IP', '%', u.NP ? 'NP' : u.IP], [],
        ['Kerikil', '%', u.G], ['Pasir', '%', u.S], ['Butir halus', '%', u.F], [],
        ['USCS', '', u.simbol], ['Nama kelompok', '', u.namaId], ['Group name (ASTM D2487)', '', u.nama],
        ['AASHTO', '', a ? a.kelompok : ''], ['Indeks kelompok', '', a ? a.GI : '']];
    },
    sumber: ['Badan Standardisasi Nasional. SNI 6371:2015 <em>Tata cara pengklasifikasian tanah untuk keperluan teknik dengan sistem klasifikasi unifikasi tanah</em>.',
      'ASTM D2487. <em>Standard practice for classification of soils for engineering purposes (Unified Soil Classification System)</em>. Bagan alir nama kelompok.',
      'AASHTO M 145. <em>Standard specification for classification of soils and soil-aggregate mixtures for highway construction purposes</em>.',
      'Das, B. M. <em>Principles of geotechnical engineering</em>. Cengage Learning. Tabel klasifikasi AASHTO dan indeks kelompok.']
  });
})();
