/* Definisi alat: sondir dan SPT dengan log bor. Halaman memilih lewat data-alat. */
(function () {
  'use strict';

  var H = window.HitungLapangan, f = Umum.f, jenisAlat = document.getElementById('alat-praktikum').dataset.alat;

  function dalam(daftar) { return daftar.map(function (z) { return { kedalaman: z }; }); }

  if (jenisAlat === 'sondir') {
    var Z = [];
    for (var i = 0; i <= 50; i++) Z.push(Math.round(i * 0.2 * 10) / 10);
    // Data contoh buatan: lempung lunak, sisipan pasir, lempung kaku, lalu lapisan keras. Bukan data lapangan sungguhan.
    var contohSondir = Z.map(function (z, k) {
      var PK, FR;
      if (z < 1) { PK = 6 + 2 * z; FR = 0.045; }
      else if (z < 5) { PK = 5 + 0.6 * Math.sin(k); FR = 0.055; }
      else if (z < 7) { PK = 40 + 20 * Math.sin((z - 5) * 1.5); FR = 0.012; }
      else if (z < 9) { PK = 22 + 4 * (z - 7); FR = 0.04; }
      else { PK = 60 + 90 * (z - 9); FR = 0.02; }
      PK = Math.max(1, Math.round(PK));
      return { kedalaman: z, PK: PK, JP: PK + Math.max(1, Math.round(PK * FR * 10)) };
    });

    function grafikTegak(id, judul, labelX, seri, zmaks, xmaks, mat) {
      return Grafik.plot({ id: id, judul: judul, lebar: 330, tinggi: 520, x: { min: 0, max: xmaks, label: labelX },
        y: { min: 0, max: zmaks, balik: true, label: 'Kedalaman (m)' }, seri: seri,
        horizontal: mat >= 0 ? [{ y: mat, teks: 'MAT', rata: 'kanan' }] : [] });
    }

    Praktikum.pasang({
      id: 'sondir', judulEkspor: 'Uji penetrasi konus / sondir (SNI 2827:2008)',
      parameter: [
        { id: 'MAT', label: 'Muka air tanah', satuan: 'm', bantuan: 'Opsional, digambar di grafik.' },
        { id: 'interval', label: 'Interval pembacaan', satuan: 'cm', bantuan: 'Kolom "HL × 20/10" pada form memakai 20 cm.' },
        { id: 'faktor', label: 'Faktor alat', bantuan: 'Pembagi pada HL × 20/10 dan HS = HL/10 di form (10 untuk konus ganda yang umum).' }],
      tabel: [{ id: 'bacaan', jenis: 'daftar', judul: 'Bacaan manometer', namaPendek: 'Bacaan sondir', maks: 200, awal: dalam(Z),
        keterangan: 'PK = perlawanan penetrasi konus, JP = jumlah perlawanan (konus + selimut). Kedalaman sudah terisi tiap 20 cm.',
        kolom: [{ id: 'kedalaman', label: 'Kedalaman', satuan: 'm', kunci: true }, { id: 'PK', label: 'PK', satuan: 'kg/cm²' }, { id: 'JP', label: 'JP', satuan: 'kg/cm²' }] }],
      contoh: { param: { MAT: 1.6, interval: 20, faktor: 10 }, tabel: { bacaan: contohSondir } },
      kosong: { param: { MAT: '', interval: 20, faktor: 10 } },
      hitung: function (m) { return H.sondir({ interval: m.param.interval, faktor: m.param.faktor, bacaan: m.tabel.bacaan }); },
      hasil: function (m, r) { return { PKmaks: r.maks.PK, kedalaman: r.akhir.kedalaman, JHL: r.JHL }; },
      tampil: function (m, r, U) {
        var T = r.titik, h = '', mat = m.param.MAT >= 0 ? m.param.MAT : -1;
        var zmaks = Math.max(1, Math.ceil(r.akhir.kedalaman - 1e-9));
        h += U.ringkasan([U.kartu('Kedalaman akhir', f(r.akhir.kedalaman, 2) + ' <small>m</small>', 'PK akhir ' + f(r.akhir.PK, 0) + ' kg/cm²'),
          U.kartu('PK terbesar', f(r.maks.PK, 0) + ' <small>kg/cm²</small>', 'pada ' + f(r.maks.kedalaman, 2) + ' m (' + f(r.maks.qcMPa, 2) + ' MPa)'),
          U.kartu('Jumlah hambatan lekat', f(r.JHL, 0) + ' <small>kg/cm</small>', 'JHL pada kedalaman akhir')]);
        var pkMaks = Math.max.apply(null, T.map(function (t) { return t.JP; })), jhlMaks = r.JHL;
        var bulat = function (v, k) { return Math.ceil(v * 1.08 / k) * k; };
        h += '<div class="kisi-grafik kisi-3">' +
          U.grafik(grafikTegak('pk', 'PK dan JP terhadap kedalaman', 'kg/cm²', [{ titik: T.map(function (t) { return [t.PK, t.kedalaman]; }), warna: 'aksen', label: 'PK' },
            { titik: T.map(function (t) { return [t.JP, t.kedalaman]; }), warna: 'teks', putus: true, label: 'JP' }], zmaks, bulat(pkMaks, 20), mat), 'Perlawanan konus (PK) dan jumlah perlawanan (JP).') +
          U.grafik(grafikTegak('jhl', 'JHL terhadap kedalaman', 'JHL (kg/cm)', [{ titik: T.map(function (t) { return [t.JHL, t.kedalaman]; }), warna: 'biru' }], zmaks, bulat(jhlMaks, 100), mat), 'Jumlah hambatan lekat (JHL).') +
          U.grafik(grafikTegak('fr', 'Rasio gesekan terhadap kedalaman', 'FR (%)', [{ titik: T.filter(function (t) { return t.FR !== null; }).map(function (t) { return [t.FR, t.kedalaman]; }), warna: 'hijau' }], zmaks,
            Math.max(8, Math.ceil(Math.max.apply(null, T.map(function (t) { return t.FR || 0; })) + 1)), mat), 'Rasio gesekan FR = HS / PK.') + '</div>';
        h += '<h3>Tabel hasil sondir</h3>' + U.tabel([{ teks: 'Kedalaman (m)' }, { teks: 'PK (kg/cm²)', angka: true }, { teks: 'JP (kg/cm²)', angka: true }, 'HL = JP − PK (kg/cm²)',
          'HL × ' + f(r.interval, 0) + '/' + f(r.faktor, 0) + ' (kg/cm)', 'JHL (kg/cm)', 'HS = HL/' + f(r.faktor, 0) + ' (kg/cm²)', 'FR (%)'],
          T.map(function (t) { return [f(t.kedalaman, 2), f(t.PK, 1), f(t.JP, 1), f(t.HL, 1), f(t.HLper, 1), f(t.JHL, 1), f(t.HS, 2), t.FR !== null ? f(t.FR, 2) : '–']; }), null, { angkaMulai: 0 });
        var a = T.filter(function (t) { return t.HL > 0; })[0] || T[0];
        h += '<h3>Langkah hitungan (kedalaman ' + f(a.kedalaman, 2) + ' m)</h3>' +
          U.langkah('Hambatan lekat', U.rumus('HL = JP - PK = ' + U.t(a.JP, 1) + ' - ' + U.t(a.PK, 1) + ' = ' + U.t(a.HL, 1) + '\\ \\text{kg/cm}^2 \\qquad (1)') +
            U.rumus('HL\\times\\dfrac{' + U.t(r.interval, 0) + '}{' + U.t(r.faktor, 0) + '} = ' + U.t(a.HLper, 1) + '\\ \\text{kg/cm},\\qquad JHL = \\sum HL\\times\\dfrac{' + U.t(r.interval, 0) + '}{' + U.t(r.faktor, 0) + '} = ' + U.t(a.JHL, 1) + '\\ \\text{kg/cm} \\qquad (2)')) +
          U.langkah('Hambatan setempat dan rasio gesekan', U.rumus('HS = \\dfrac{HL}{' + U.t(r.faktor, 0) + '} = ' + U.t(a.HS, 2) + '\\ \\text{kg/cm}^2,\\qquad FR = \\dfrac{HS}{PK}\\times 100\\% = ' + U.t(a.FR, 2) + '\\% \\qquad (3)') +
            '<p class="ket">PK dalam MPa = PK (kg/cm²) × 0,0980665. Rumus mengikuti kolom form sondir laboratorium.</p>');
        return h;
      },
      ekspor: function (m, r) {
        var b = [['Kedalaman (m)', 'PK (kg/cm2)', 'JP (kg/cm2)', 'HL (kg/cm2)', 'HL x interval/faktor (kg/cm)', 'JHL (kg/cm)', 'HS (kg/cm2)', 'FR (%)']];
        r.titik.forEach(function (t) { b.push([t.kedalaman, t.PK, t.JP, t.HL, t.HLper, t.JHL, t.HS, t.FR === null ? '' : t.FR]); });
        return b;
      },
      sumber: ['Badan Standardisasi Nasional. SNI 2827:2008, uji penetrasi lapangan dengan alat sondir.',
        'Form uji penetrasi konus Laboratorium Mekanika Tanah: kolom PK, JP, HL, HL × 20/10, JHL, dan HS = HL/10.']
    });
  }

  if (jenisAlat === 'spt') {
    var JENIS = [['lempung', 'Lempung'], ['lanau', 'Lanau'], ['pasir', 'Pasir'], ['kerikil', 'Kerikil'], ['organik', 'Organik/gambut'], ['urugan', 'Tanah urug'], ['batuan', 'Batuan']];
    var NAMA = {};
    JENIS.forEach(function (j) { NAMA[j[0]] = j[1]; });

    // Pola arsir lapisan untuk log bor.
    var POLA = {
      lempung: '<rect width="10" height="8" style="fill:var(--lempung);fill-opacity:.45"/><line x1="0" y1="4" x2="10" y2="4" style="stroke:var(--teks-2);stroke-width:.8"/>',
      lanau: '<rect width="10" height="8" style="fill:var(--lempung);fill-opacity:.25"/><line x1="0" y1="4" x2="5" y2="4" style="stroke:var(--teks-2);stroke-width:.8"/>',
      pasir: '<rect width="10" height="8" style="fill:var(--pasir);fill-opacity:.8"/><circle cx="2.5" cy="2" r=".9" style="fill:var(--teks-2)"/><circle cx="7.5" cy="6" r=".9" style="fill:var(--teks-2)"/>',
      kerikil: '<rect width="10" height="8" style="fill:var(--pasir);fill-opacity:.5"/><circle cx="5" cy="4" r="2.4" style="fill:none;stroke:var(--teks-2);stroke-width:.8"/>',
      organik: '<rect width="10" height="8" style="fill:var(--teks-2);fill-opacity:.25"/><line x1="0" y1="8" x2="10" y2="0" style="stroke:var(--teks-2);stroke-width:.8"/>',
      urugan: '<rect width="10" height="8" style="fill:var(--permukaan)"/><path d="M2 2 L5 5 M5 2 L2 5 M7 5 L9 7 M9 5 L7 7" style="stroke:var(--teks-2);stroke-width:.7"/>',
      batuan: '<rect width="10" height="8" style="fill:var(--teks-2);fill-opacity:.15"/><path d="M0 4 H10 M5 0 V4 M0 8 H10" style="stroke:var(--teks-2);stroke-width:.8"/>'
    };

    function logBor(r) {
      var W = 640, Hg = 580, atas = 44, bawah = 34, lh = Hg - atas - bawah;
      var zmaks = Math.max(2, Math.ceil(r.dalam / 2) * 2), fy = function (z) { return atas + z / zmaks * lh; };
      var Nmaks = Math.max(50, Math.ceil(Math.max.apply(null, r.uji.map(function (u) { return u.N60 !== undefined ? Math.max(u.N, u.N60) : u.N; }).concat([0])) / 10) * 10);
      var x0 = 250, xw = 360, fx = function (n) { return x0 + n / Nmaks * xw; };
      var s = '<svg class="grafik" viewBox="0 0 ' + W + ' ' + Hg + '" role="img" aria-label="Log bor dan N-SPT"><defs>' +
        Object.keys(POLA).map(function (k) { return '<pattern id="pola-' + k + '" width="10" height="8" patternUnits="userSpaceOnUse">' + POLA[k] + '</pattern>'; }).join('') + '</defs>';
      s += '<text x="140" y="24" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--teks)">Log</text>';
      s += '<text x="' + (x0 + xw / 2) + '" y="24" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--teks)">Nilai N-SPT</text>';
      // kedalaman
      for (var z = 0; z <= zmaks + 1e-9; z += zmaks > 20 ? 2 : 1) {
        s += '<line x1="84" x2="' + (x0 + xw) + '" y1="' + fy(z) + '" y2="' + fy(z) + '" style="stroke:var(--garis)"/>';
        s += '<text x="76" y="' + (fy(z) + 4) + '" text-anchor="end" font-size="12" style="fill:var(--teks-2)">' + f(z, 0) + '</text>';
      }
      s += '<text x="22" y="' + (atas + lh / 2) + '" text-anchor="middle" font-size="13" transform="rotate(-90 22 ' + (atas + lh / 2) + ')" style="fill:var(--teks)">Kedalaman (m)</text>';
      r.lapisan.forEach(function (l) {
        var y1 = fy(l.dari), y2 = fy(Math.min(l.sampai, zmaks));
        s += '<rect x="90" y="' + y1 + '" width="100" height="' + (y2 - y1) + '" style="fill:url(#pola-' + l.jenis + ');stroke:var(--teks);stroke-width:1"/>';
        if (y2 - y1 >= 18) s += '<text x="140" y="' + ((y1 + y2) / 2 + 4) + '" text-anchor="middle" font-size="11.5" font-weight="700" style="fill:var(--teks);paint-order:stroke;stroke:var(--permukaan);stroke-width:3px">' + NAMA[l.jenis] + '</text>';
      });
      // sumbu N
      for (var n = 0; n <= Nmaks; n += 10) {
        s += '<line x1="' + fx(n) + '" x2="' + fx(n) + '" y1="' + atas + '" y2="' + (atas + lh) + '" style="stroke:var(--garis)"/>';
        s += '<text x="' + fx(n) + '" y="' + (atas - 6) + '" text-anchor="middle" font-size="11.5" style="fill:var(--teks-2)">' + n + '</text>';
      }
      s += '<rect x="' + x0 + '" y="' + atas + '" width="' + xw + '" height="' + lh + '" style="fill:none;stroke:var(--teks-2)"/>';
      if (r.MAT >= 0 && r.MAT <= zmaks) {
        s += '<line x1="84" x2="' + (x0 + xw) + '" y1="' + fy(r.MAT) + '" y2="' + fy(r.MAT) + '" style="stroke:#3a7fc1;stroke-width:1.6;stroke-dasharray:6 4"/>';
        s += '<text x="' + (x0 + xw - 4) + '" y="' + (fy(r.MAT) - 5) + '" text-anchor="end" font-size="12" font-weight="700" style="fill:#3a7fc1">MAT ' + f(r.MAT, 2) + ' m</text>';
      }
      var u = r.uji;
      if (u.length > 1) s += '<polyline points="' + u.map(function (x) { return fx(x.N) + ',' + fy(x.kedalaman); }).join(' ') + '" style="fill:none;stroke:var(--aksen);stroke-width:2.2"/>';
      if (u.length > 1 && u[0].N60 !== undefined) s += '<polyline points="' + u.map(function (x) { return fx(x.N60) + ',' + fy(x.kedalaman); }).join(' ') + '" style="fill:none;stroke:var(--teks-2);stroke-width:1.6;stroke-dasharray:6 4"/>';
      u.forEach(function (x) {
        s += '<circle cx="' + fx(x.N) + '" cy="' + fy(x.kedalaman) + '" r="4.5" style="fill:var(--permukaan);stroke:var(--aksen);stroke-width:2.2"/>';
        s += '<text x="' + (fx(x.N) + 9) + '" y="' + (fy(x.kedalaman) + 4) + '" font-size="12" font-weight="700" style="fill:var(--teks);paint-order:stroke;stroke:var(--permukaan);stroke-width:4px">' + x.N + (x.tolak ? '*' : '') + '</text>';
      });
      if (u.length && u[0].N60 !== undefined) {
        s += '<line x1="' + (x0 + 10) + '" x2="' + (x0 + 32) + '" y1="' + (Hg - 12) + '" y2="' + (Hg - 12) + '" style="stroke:var(--aksen);stroke-width:2.2"/><text x="' + (x0 + 38) + '" y="' + (Hg - 8) + '" font-size="12" style="fill:var(--teks)">N lapangan</text>';
        s += '<line x1="' + (x0 + 140) + '" x2="' + (x0 + 162) + '" y1="' + (Hg - 12) + '" y2="' + (Hg - 12) + '" style="stroke:var(--teks-2);stroke-width:1.6;stroke-dasharray:6 4"/><text x="' + (x0 + 168) + '" y="' + (Hg - 8) + '" font-size="12" style="fill:var(--teks)">N₆₀</text>';
      }
      return s + '</svg>';
    }

    Praktikum.pasang({
      id: 'spt', judulEkspor: 'Standard Penetration Test dan log bor (SNI 4153:2008)',
      parameter: [
        { id: 'MAT', label: 'Muka air tanah', satuan: 'm', bantuan: 'Opsional.' },
        { id: 'Er', label: 'Efisiensi energi palu, E<sub>r</sub>', satuan: '%', bantuan: 'Opsional, untuk N<sub>60</sub> = N E<sub>r</sub> / 60. Koreksi lain (batang, tabung, lubang bor) tidak dihitung.' }],
      tabel: [
        { id: 'uji', jenis: 'daftar', judul: 'Data SPT', namaPendek: 'SPT', maks: 60, awal: 8,
          keterangan: 'Jumlah pukulan tiap 15 cm. N = N2 + N3. Kedalaman = awal pengujian.',
          kolom: [{ id: 'kedalaman', label: 'Kedalaman', satuan: 'm' }, { id: 'N1', label: 'N1', satuan: 'pukulan' }, { id: 'N2', label: 'N2', satuan: 'pukulan' }, { id: 'N3', label: 'N3', satuan: 'pukulan' }] },
        { id: 'lapisan', jenis: 'daftar', judul: 'Lapisan tanah (log bor)', namaPendek: 'Lapisan', maks: 40, awal: 5,
          keterangan: 'Deskripsi seperti pada form boring log: jenis, warna, konsistensi, catatan contoh.',
          kolom: [{ id: 'dari', label: 'Dari', satuan: 'm' }, { id: 'sampai', label: 'Sampai', satuan: 'm' }, { id: 'jenis', label: 'Jenis', pilihan: JENIS },
            { id: 'deskripsi', label: 'Deskripsi', teks: true }] }],
      contoh: { param: { MAT: 2.5, Er: '' }, tabel: {
        uji: [[2, 1, 2, 2], [4, 2, 3, 3], [6, 3, 4, 5], [8, 5, 8, 10], [10, 9, 12, 14], [12, 6, 8, 9], [14, 8, 11, 13], [16, 14, 20, 26], [18, 22, 30, 35]]
          .map(function (u) { return { kedalaman: u[0], N1: u[1], N2: u[2], N3: u[3] }; }),
        lapisan: [[0, 1.5, 'urugan', 'Tanah urug, cokelat, bercampur kerikil'], [1.5, 7, 'lempung', 'Lempung, abu-abu kecokelatan, lunak sampai sedang'],
          [7, 11, 'pasir', 'Pasir berlanau, abu-abu, sedang'], [11, 15, 'lempung', 'Lempung berlanau, abu-abu tua, kaku'], [15, 19, 'pasir', 'Pasir padat, abu-abu terang']]
          .map(function (l) { return { dari: l[0], sampai: l[1], jenis: l[2], deskripsi: l[3] }; }) } },
      kosong: { param: { MAT: '', Er: '' } },
      hitung: function (m) { return H.spt({ MAT: m.param.MAT, Er: m.param.Er, uji: m.tabel.uji, lapisan: m.tabel.lapisan }); },
      tampil: function (m, r, U) {
        var h = '', u = r.uji, n60 = r.Er > 0;
        var Nmaks = u.length ? u.reduce(function (a, x) { return x.N > a.N ? x : a; }) : null;
        h += U.ringkasan([U.kartu('Kedalaman bor', f(r.dalam, 2) + ' <small>m</small>', r.lapisan.length + ' lapisan, ' + u.length + ' titik SPT'),
          U.kartu('N terbesar', Nmaks ? Nmaks.N + (Nmaks.tolak ? '*' : '') : '–', Nmaks ? 'pada ' + f(Nmaks.kedalaman, 2) + ' m' + (Nmaks.keadaan ? ', ' + Nmaks.keadaan.toLowerCase() : '') : ''),
          U.kartu('Muka air tanah', r.MAT >= 0 ? f(r.MAT, 2) + ' <small>m</small>' : '–', 'dari permukaan')]);
        h += U.grafik(logBor(r), 'Log bor dan nilai N-SPT terhadap kedalaman.' + (u.some(function (x) { return x.tolak; }) ? ' Tanda * = penolakan (50 pukulan).' : ''));
        if (u.length) {
          h += '<h3>Tabel hasil SPT</h3>' + U.tabel([{ teks: 'Kedalaman (m)' }, { teks: 'N1', angka: true }, { teks: 'N2', angka: true }, 'N3', 'N = N2 + N3'].concat(n60 ? ['N<sub>60</sub>'] : []).concat([{ teks: 'Jenis tanah' }, { teks: 'Kepadatan / konsistensi' }]),
            u.map(function (x) { return [f(x.kedalaman, 2), x.N1, x.N2, x.N3, x.N + (x.tolak ? '*' : '')].concat(n60 ? [f(x.N60, 1)] : []).concat([x.jenis ? NAMA[x.jenis] : '–', x.keadaan || '–']); }), null,
            { kanan: n60 ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4] });
        }
        if (r.lapisan.length) {
          h += '<h3>Tabel log bor</h3>' + U.tabel([{ teks: 'Dari (m)' }, { teks: 'Sampai (m)' }, { teks: 'Tebal (m)' }, { teks: 'Jenis' }, { teks: 'Deskripsi' }],
            r.lapisan.map(function (l) { return [f(l.dari, 2), f(l.sampai, 2), f(l.sampai - l.dari, 2), NAMA[l.jenis], l.deskripsi || '']; }), null, { angkaMulai: 99 });
        }
        if (u.length) {
          var a = u[0];
          h += '<h3>Langkah hitungan</h3>' + U.langkah('Nilai N (kedalaman ' + f(a.kedalaman, 2) + ' m)', U.rumus('N = N_2 + N_3 = ' + a.N2 + ' + ' + a.N3 + ' = ' + a.N + ' \\qquad (1)') +
            (n60 ? U.rumus('N_{60} = \\dfrac{N\\,E_r}{60} = \\dfrac{' + a.N + '\\times' + U.t(r.Er, 0) + '}{60} = ' + U.t(a.N60, 1) + ' \\qquad (2)') : '') +
            '<p class="ket">N1 (15 cm pertama) dianggap dudukan dan tidak dihitung. Kepadatan pasir dan konsistensi lempung dibaca dari rentang N menurut Terzaghi &amp; Peck.</p>');
          h += '<h3>Rentang N (Terzaghi &amp; Peck)</h3>' + U.tabel([{ teks: 'Pasir: N' }, { teks: 'Kepadatan' }, { teks: 'Lempung: N' }, { teks: 'Konsistensi' }],
            [['0 – 4', 'Sangat lepas', '< 2', 'Sangat lunak'], ['4 – 10', 'Lepas', '2 – 4', 'Lunak'], ['10 – 30', 'Sedang', '4 – 8', 'Sedang'], ['30 – 50', 'Padat', '8 – 15', 'Kaku'],
              ['> 50', 'Sangat padat', '15 – 30', 'Sangat kaku'], ['', '', '> 30', 'Keras']], null, { angkaMulai: 99 });
        }
        return h;
      },
      ekspor: function (m, r) {
        var b = [['Kedalaman (m)', 'N1', 'N2', 'N3', 'N', 'N60', 'Jenis', 'Keadaan']];
        r.uji.forEach(function (x) { b.push([x.kedalaman, x.N1, x.N2, x.N3, x.N, x.N60 === undefined ? '' : x.N60, x.jenis ? NAMA[x.jenis] : '', x.keadaan || '']); });
        b.push([], ['Dari (m)', 'Sampai (m)', 'Jenis', 'Deskripsi']);
        r.lapisan.forEach(function (l) { b.push([l.dari, l.sampai, NAMA[l.jenis], l.deskripsi || '']); });
        return b;
      },
      sumber: ['Badan Standardisasi Nasional. SNI 4153:2008, uji penetrasi lapangan dengan SPT.',
        'Terzaghi, K., &amp; Peck, R. B. (1967). <em>Soil mechanics in engineering practice</em> (2nd ed.). John Wiley &amp; Sons. Hubungan N dengan kepadatan dan konsistensi.',
        'Skempton, A. W. (1986). Standard penetration test procedures and the effects in sands of overburden pressure, relative density, particle size, ageing and overconsolidation. <em>Géotechnique, 36</em>(3), 425–447. Koreksi energi N<sub>60</sub>.']
    });
  }
})();
