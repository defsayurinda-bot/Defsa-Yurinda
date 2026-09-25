/* Tampilan kalkulator tiang bor: formulir, profil tanah, dan langkah hitungan. */
(function () {
  'use strict';

  var CONTOH = {
    d: 0.6, L: 12, SF: 2.5, gammaBeton: 24, pakaiBerat: true, perpindahan: 'kecil',
    lapisan: [
      { bawah: 3, jenis: 'lempung', N: 4, cu: 25 },
      { bawah: 7, jenis: 'lempung', N: 8, cu: 50 },
      { bawah: 11, jenis: 'pasir', N: 20, cu: null },
      { bawah: 16, jenis: 'pasir', N: 40, cu: null },
      { bawah: 20, jenis: 'pasir', N: 55, cu: null }
    ]
  };
  var KN_PER_TON = 9.80665;

  var $ = function (id) { return document.getElementById(id); };
  var keadaan = salin(CONTOH);

  function salin(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------- Format angka (desimal koma, ribuan titik) ----------
  function f(x, d) {
    if (d === undefined) d = 2;
    if (!isFinite(x)) return '–';
    return x.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function t(x, d) { return f(x, d).replace(/,/g, '{,}'); } // angka untuk TeX
  function tex(s, blok) {
    if (window.katex) {
      try { return katex.renderToString(s, { displayMode: !!blok, throwOnError: false }); } catch (e) { /* lanjut */ }
    }
    return '<code>' + s.replace(/</g, '&lt;') + '</code>';
  }
  function rumus(s) { return '<div class="rumus">' + tex(s, true) + '</div>'; }

  // ---------- Formulir ----------
  function isiFormulir() {
    ['d', 'L', 'SF', 'gammaBeton'].forEach(function (k) { $(k).value = keadaan[k]; });
    $('perpindahan').value = keadaan.perpindahan;
    $('pakaiBerat').checked = keadaan.pakaiBerat;
    $('gammaBeton').disabled = !keadaan.pakaiBerat;
    gambarTabelLapisan();
  }

  function gambarTabelLapisan() {
    var badan = $('badanLapisan'), atas = 0;
    badan.innerHTML = '';
    keadaan.lapisan.forEach(function (ly, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + (i + 1) + '</td>' +
        '<td class="angka">' + f(atas, 2) + '</td>' +
        '<td><input type="number" step="0.5" inputmode="decimal" data-k="bawah" value="' + ly.bawah + '" aria-label="Kedalaman bawah lapisan ' + (i + 1) + '"></td>' +
        '<td><select data-k="jenis" aria-label="Jenis tanah lapisan ' + (i + 1) + '">' +
          '<option value="pasir"' + (ly.jenis === 'pasir' ? ' selected' : '') + '>Pasir</option>' +
          '<option value="lempung"' + (ly.jenis === 'lempung' ? ' selected' : '') + '>Lempung</option></select></td>' +
        '<td><input type="number" step="1" min="0" inputmode="numeric" data-k="N" value="' + ly.N + '" aria-label="N-SPT lapisan ' + (i + 1) + '"></td>' +
        '<td><input type="number" step="5" min="0" inputmode="decimal" data-k="cu" value="' + (ly.cu == null ? '' : ly.cu) + '"' +
          (ly.jenis === 'lempung' ? '' : ' disabled') + ' aria-label="cu lapisan ' + (i + 1) + '"></td>' +
        '<td><button type="button" class="tombol kecil" data-hapus="' + i + '" aria-label="Hapus lapisan ' + (i + 1) + '">×</button></td>';
      tr.querySelectorAll('[data-k]').forEach(function (el) {
        var k = el.dataset.k;
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
          ly[k] = k === 'jenis' ? el.value : (el.value === '' ? null : parseFloat(el.value));
          if (k === 'jenis') gambarTabelLapisan();
          perbarui();
        });
        // Kolom "Atas" lapisan berikutnya diperbarui setelah selesai mengetik, supaya fokus tidak hilang.
        if (k === 'bawah') el.addEventListener('change', gambarTabelLapisan);
      });
      badan.appendChild(tr);
      atas = ly.bawah;
    });
    badan.querySelectorAll('[data-hapus]').forEach(function (b) {
      b.addEventListener('click', function () {
        keadaan.lapisan.splice(+b.dataset.hapus, 1);
        gambarTabelLapisan();
        perbarui();
      });
    });
  }

  function masukanHitung() {
    var atas = 0;
    return {
      d: keadaan.d, L: keadaan.L, SF: keadaan.SF, gammaBeton: keadaan.gammaBeton,
      pakaiBerat: keadaan.pakaiBerat, perpindahan: keadaan.perpindahan,
      lapisan: keadaan.lapisan.map(function (ly) {
        var o = { atas: atas, bawah: ly.bawah, jenis: ly.jenis, N: ly.N, cu: ly.cu };
        atas = ly.bawah;
        return o;
      })
    };
  }

  // ---------- Profil tanah (SVG) ----------
  function gambarProfil(m, r) {
    var W = 280, H = 440, atasY = 24, bawahY = H - 16, kiri = 36;
    var dalam = m.lapisan.length ? m.lapisan[m.lapisan.length - 1].bawah : 10;
    if (!(dalam > 0)) dalam = 10;
    var y = function (z) { return atasY + (z / dalam) * (bawahY - atasY); };
    var lebarTanah = 150, xN = kiri + lebarTanah + 14, lebarN = W - xN - 8;
    var s = '<svg class="profil-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Profil lapisan tanah dan tiang">';
    s += '<defs><pattern id="arsir" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<line x1="0" y1="0" x2="0" y2="6" style="stroke:var(--aksen);stroke-width:1.5;opacity:.55"/></pattern></defs>';

    m.lapisan.forEach(function (ly, i) {
      var y1 = y(ly.atas), y2 = y(ly.bawah);
      if (!(y2 > y1)) return;
      s += '<rect x="' + kiri + '" y="' + y1 + '" width="' + lebarTanah + '" height="' + (y2 - y1) + '" style="fill:var(--' + (ly.jenis === 'lempung' ? 'lempung' : 'pasir') + ');stroke:var(--latar);stroke-width:1"/>';
      if (y2 - y1 > 14) {
        s += '<text x="' + (kiri + lebarTanah - 6) + '" y="' + ((y1 + y2) / 2 + 4) + '" text-anchor="end" font-size="11" style="fill:var(--teks)">' +
          (ly.jenis === 'lempung' ? 'Lempung' : 'Pasir') + '</text>';
      }
      var lebar = Math.min(ly.N, 60) / 60 * lebarN;
      s += '<rect x="' + xN + '" y="' + (y1 + 1) + '" width="' + Math.max(lebar, 1) + '" height="' + Math.max(y2 - y1 - 2, 1) + '" rx="2" style="fill:var(--teks-2);opacity:.35"/>';
      if (y2 - y1 > 12) s += '<text x="' + (xN + 4) + '" y="' + ((y1 + y2) / 2 + 4) + '" font-size="11" style="fill:var(--teks)">' + ly.N + '</text>';
    });

    if (r && !r.galat.length) {
      var z1 = r.meyerhof.zona.atas, z2 = Math.min(r.meyerhof.zona.bawah, dalam);
      s += '<rect x="' + kiri + '" y="' + y(z1) + '" width="' + lebarTanah + '" height="' + (y(z2) - y(z1)) + '" fill="url(#arsir)"/>';
    }
    if (m.L > 0 && m.L <= dalam * 1.5) {
      var lebarTiang = 22, xT = kiri + 34;
      s += '<rect x="' + xT + '" y="' + atasY + '" width="' + lebarTiang + '" height="' + (y(Math.min(m.L, dalam)) - atasY) + '" rx="2" style="fill:var(--tiang);stroke:var(--teks);stroke-width:1"/>';
      s += '<text x="' + (xT + lebarTiang / 2) + '" y="' + (atasY - 8) + '" text-anchor="middle" font-size="11" font-weight="700" style="fill:var(--teks)">d = ' + f(m.d, 2) + ' m</text>';
      s += '<line x1="' + (kiri - 4) + '" x2="' + (kiri + lebarTanah) + '" y1="' + y(Math.min(m.L, dalam)) + '" y2="' + y(Math.min(m.L, dalam)) + '" style="stroke:var(--aksen);stroke-width:1.5;stroke-dasharray:4 3"/>';
    }
    s += '<line x1="' + kiri + '" x2="' + (kiri + lebarTanah) + '" y1="' + atasY + '" y2="' + atasY + '" style="stroke:var(--teks);stroke-width:2"/>';

    var langkah = dalam > 30 ? 10 : dalam > 12 ? 5 : 2;
    for (var z = 0; z <= dalam + 1e-9; z += langkah) {
      s += '<text x="' + (kiri - 6) + '" y="' + (y(z) + 4) + '" text-anchor="end" font-size="10" style="fill:var(--teks-2)">' + f(z, 0) + '</text>';
    }
    s += '<text x="' + (kiri - 6) + '" y="12" text-anchor="end" font-size="10" style="fill:var(--teks-2)">z (m)</text>';
    s += '<text x="' + xN + '" y="12" font-size="10" style="fill:var(--teks-2)">N-SPT</text>';
    s += '</svg>';
    $('profil').innerHTML = s;
  }

  // ---------- Hasil ----------
  function tabelSelimut(segmen, jenisMetode) {
    var baris = segmen.map(function (s) {
      var dasar = jenisMetode === 'rw' && s.jenis === 'lempung' ? 'c<sub>u</sub> = ' + f(s.cu, 0) + ' kPa' : 'N = ' + f(s.N, 0);
      return '<tr><td>' + f(s.atas) + ' – ' + f(s.bawah) + '</td><td class="angka">' + f(s.tebal) + '</td><td>' +
        (s.jenis === 'lempung' ? 'Lempung' : 'Pasir') + '</td><td>' + dasar + '</td><td class="angka">' + f(s.fs) +
        '</td><td class="angka">' + f(s.Qs) + '</td></tr>';
    }).join('');
    var total = segmen.reduce(function (a, s) { return a + s.Qs; }, 0);
    return '<div class="tabel-gulir"><table><thead><tr><th>Kedalaman (m)</th><th class="angka">Δz (m)</th><th>Jenis</th><th>Dasar</th>' +
      '<th class="angka">f<sub>s</sub> (kPa)</th><th class="angka">Q<sub>s,i</sub> (kN)</th></tr></thead><tbody>' + baris +
      '</tbody><tfoot><tr><td colspan="5">Jumlah, Q<sub>s</sub></td><td class="angka">' + f(total) + '</td></tr></tfoot></table></div>';
  }

  function blokQuQa(m, r) {
    var s = rumus('Q_u = Q_p + Q_s - W = ' + t(r.Qp) + ' + ' + t(r.Qs) + ' - ' + t(r.W) + ' = ' + t(r.Qu) + '\\ \\text{kN}');
    s += rumus('Q_a = \\dfrac{Q_u}{SF} = \\dfrac{' + t(r.Qu) + '}{' + t(m.SF, 1) + '} = ' + t(r.Qa) + '\\ \\text{kN} \\approx ' + t(r.Qa / KN_PER_TON) + '\\ \\text{ton}');
    return s;
  }

  function gambarHasil(m, r) {
    var el = $('hasil');
    if (r.galat.length) {
      el.innerHTML = '<h2>Hasil</h2>' + r.galat.map(function (g) { return '<div class="catatan galat">' + g + '</div>'; }).join('');
      return;
    }
    var rw = r.reeseWright, my = r.meyerhof, g = r.geo;
    var lyU = m.lapisan[rw.lapisanUjung];
    var h = '';

    // Ringkasan
    var maks = Math.max(rw.Qa, my.Qa, 1);
    h += '<h2>Ringkasan</h2><div class="ringkasan">';
    [['Reese & Wright (1977)', rw, ''], ['Meyerhof (1976)', my, ' b2']].forEach(function (x) {
      h += '<div class="kartu"><div class="redup kecil" style="font-weight:700">' + x[0] + '</div>' +
        '<div class="nilai-besar">' + f(x[1].Qa, 0) + ' <small>kN</small></div>' +
        '<div class="redup kecil">Q<sub>a</sub> ≈ ' + f(x[1].Qa / KN_PER_TON, 1) + ' ton · Q<sub>u</sub> = ' + f(x[1].Qu, 0) + ' kN</div>' +
        '<div class="batang' + x[2] + '" style="width:' + Math.max(2, x[1].Qa / maks * 100) + '%;margin-top:10px"></div></div>';
    });
    h += '</div>';
    var semuaPeringatan = rw.peringatan.concat(my.peringatan);
    semuaPeringatan.forEach(function (p) { h += '<div class="catatan">' + p + '</div>'; });

    // 1. Diketahui
    h += '<h2>1. Diketahui</h2><div class="tabel-gulir"><table><thead><tr><th>Simbol</th><th>Besaran</th><th class="angka">Nilai</th><th>Satuan</th></tr></thead><tbody>' +
      '<tr><td><i>d</i></td><td>Diameter tiang</td><td class="angka">' + f(m.d) + '</td><td>m</td></tr>' +
      '<tr><td><i>L</i></td><td>Panjang tiang tertanam</td><td class="angka">' + f(m.L) + '</td><td>m</td></tr>' +
      '<tr><td><i>SF</i></td><td>Faktor keamanan</td><td class="angka">' + f(m.SF, 1) + '</td><td>–</td></tr>' +
      (m.pakaiBerat ? '<tr><td>γ<sub>c</sub></td><td>Berat volume beton</td><td class="angka">' + f(m.gammaBeton, 1) + '</td><td>kN/m³</td></tr>' : '') +
      '<tr><td>σ<sub>r</sub></td><td>Tegangan referensi (Meyerhof)</td><td class="angka">100</td><td>kPa</td></tr>' +
      '</tbody></table></div>';
    h += '<p class="kecil redup" style="margin-top:10px">Tiang ' + (m.perpindahan === 'besar' ? 'dianggap berperpindahan besar (pancang)' : 'dianggap berperpindahan kecil (tiang bor)') +
      '. Data lapisan tanah sesuai tabel di atas; ujung tiang berada di lapisan ' + (rw.lapisanUjung + 1) + ' (' + (lyU.jenis === 'lempung' ? 'lempung' : 'pasir') + ').</p>';

    // 2. Ditanya
    h += '<h2>2. Ditanya</h2><ol><li>Daya dukung ultimit Q<sub>u</sub> dan izin Q<sub>a</sub> dengan metode Reese &amp; Wright (1977).</li>' +
      '<li>Daya dukung ultimit Q<sub>u</sub> dan izin Q<sub>a</sub> dengan metode Meyerhof (1976).</li></ol>';

    // 3. Penyelesaian
    h += '<h2>3. Penyelesaian</h2>';
    h += '<div class="langkah"><h4>a. Geometri tiang</h4>' +
      rumus('A_p = \\tfrac{1}{4}\\pi d^2 = \\tfrac{1}{4} \\times \\pi \\times ' + t(m.d) + '^2 = ' + t(g.Ap, 4) + '\\ \\text{m}^2') +
      rumus('p = \\pi d = \\pi \\times ' + t(m.d) + ' = ' + t(g.p, 4) + '\\ \\text{m}') +
      '<p class="ket">A<sub>p</sub> = luas penampang ujung tiang; p = keliling tiang.</p></div>';
    h += '<div class="langkah"><h4>b. Berat sendiri tiang</h4>' +
      (m.pakaiBerat
        ? rumus('W = \\gamma_c \\, A_p \\, L = ' + t(m.gammaBeton, 1) + ' \\times ' + t(g.Ap, 4) + ' \\times ' + t(m.L) + ' = ' + t(r.W) + '\\ \\text{kN}')
        : '<p>Berat sendiri tiang tidak dikurangkan (W = 0), sesuai pilihan pada formulir.</p>') + '</div>';

    // Metode A
    h += '<h3>Metode A — Reese &amp; Wright (1977)</h3>';
    h += '<div class="langkah"><h4>c. Tahanan ujung</h4>';
    if (rw.ujung.rumus === 'kohesif') {
      h += '<p>Ujung tiang di tanah kohesif, c<sub>u</sub> = ' + f(rw.ujung.cu, 0) + ' kPa.</p>' +
        rumus('q_p = 9\\,c_u = 9 \\times ' + t(rw.ujung.cu, 0) + ' = ' + t(rw.qp) + '\\ \\text{kPa}');
    } else {
      h += '<p>Ujung tiang di tanah nonkohesif, N = ' + f(rw.ujung.N, 0) + '. Batas atas q<sub>p</sub> = 400 t/m².</p>' +
        rumus('q_p = 7N = 7 \\times ' + t(rw.ujung.N, 0) + ' = ' + t(7 * rw.ujung.N, 0) + '\\ \\text{t/m}^2' +
          (rw.ujung.dibatasi ? ' > 400 \\;\\Rightarrow\\; q_p = 400\\ \\text{t/m}^2' : ' \\le 400\\ \\text{t/m}^2')) +
        rumus('q_p = ' + t(rw.ujung.qpT, 0) + ' \\times 9{,}80665 = ' + t(rw.qp) + '\\ \\text{kPa}');
    }
    h += rumus('Q_p = q_p \\, A_p = ' + t(rw.qp) + ' \\times ' + t(g.Ap, 4) + ' = ' + t(rw.Qp) + '\\ \\text{kN}') + '</div>';
    h += '<div class="langkah"><h4>d. Tahanan selimut</h4>' +
      rumus('f_s = 0{,}32\\,N\\ \\text{(t/m}^2\\text{)}\\ \\text{(pasir, } N < 53) \\qquad f_s = \\alpha\\,c_u,\\ \\alpha = 0{,}55\\ \\text{(lempung)}') +
      rumus('Q_s = \\sum f_{s,i}\\, p\\, \\Delta z_i') +
      '<p class="ket">f<sub>s</sub> pasir dikonversi ke kPa dengan faktor 9,80665. Δz = tebal lapisan sepanjang tiang.</p>' +
      tabelSelimut(rw.segmen, 'rw') + '</div>';
    h += '<div class="langkah"><h4>e. Daya dukung ultimit dan izin</h4>' + blokQuQa(m, rw) + '</div>';

    // Metode B
    var zonaTeks = f(my.zona.atas) + ' – ' + f(my.zona.bawah) + ' m';
    h += '<h3>Metode B — Meyerhof (1976)</h3>';
    h += '<div class="langkah"><h4>c. N rata-rata di zona ujung</h4>' +
      '<p>Zona dari 8d di atas sampai 4d di bawah ujung tiang: ' + zonaTeks + '.</p>' +
      rumus('\\bar N = \\dfrac{\\sum N_i\\,\\Delta z_i}{\\sum \\Delta z_i} = ' + t(my.Nrata) + '') +
      '<p class="ket">Kedalaman tertanam di lapisan pendukung: L<sub>b</sub> = ' + f(my.Lb) + ' m (dari batas atas lapisan ' + (my.lapisanUjung + 1) + ' sampai ujung tiang).</p></div>';
    h += '<div class="langkah"><h4>d. Tahanan ujung</h4>' +
      rumus('q_p = 38\\,\\bar N\\,\\dfrac{L_b}{d} = 38 \\times ' + t(my.Nrata) + ' \\times \\dfrac{' + t(my.Lb) + '}{' + t(m.d) + '} = ' + t(my.qpTanpaBatas) + '\\ \\text{kPa}') +
      rumus('q_{p,\\text{maks}} = 380\\,\\bar N = 380 \\times ' + t(my.Nrata) + ' = ' + t(my.qpBatas) + '\\ \\text{kPa}') +
      '<p>' + (my.dibatasi ? 'Nilai hitungan melebihi batas, jadi dipakai q<sub>p</sub> = ' + f(my.qp) + ' kPa.' : 'Nilai hitungan di bawah batas, jadi dipakai q<sub>p</sub> = ' + f(my.qp) + ' kPa.') + '</p>' +
      rumus('Q_p = q_p \\, A_p = ' + t(my.qp) + ' \\times ' + t(g.Ap, 4) + ' = ' + t(my.Qp) + '\\ \\text{kN}') + '</div>';
    h += '<div class="langkah"><h4>e. Tahanan selimut</h4>' +
      rumus('f_s = \\dfrac{1}{' + my.pembagi + '}\\,\\sigma_r\\,N = \\dfrac{100\\,N}{' + my.pembagi + '}\\ \\text{kPa}') +
      tabelSelimut(my.segmen, 'my') + '</div>';
    h += '<div class="langkah"><h4>f. Daya dukung ultimit dan izin</h4>' + blokQuQa(m, my) + '</div>';

    // 4. Hasil dan penjelasan
    var selisih = Math.abs(rw.Qu - my.Qu) / Math.max(rw.Qu, my.Qu) * 100;
    var dQp = rw.Qp - my.Qp, dQs = rw.Qs - my.Qs;
    var sumber = Math.abs(dQp) >= Math.abs(dQs) ? 'tahanan ujung' : 'tahanan selimut';
    h += '<h2>4. Hasil dan penjelasan</h2><div class="tabel-gulir"><table><thead><tr><th>Komponen</th><th class="angka">Reese &amp; Wright</th><th class="angka">Meyerhof</th></tr></thead><tbody>' +
      '<tr><td>Q<sub>p</sub> (kN)</td><td class="angka">' + f(rw.Qp) + '</td><td class="angka">' + f(my.Qp) + '</td></tr>' +
      '<tr><td>Q<sub>s</sub> (kN)</td><td class="angka">' + f(rw.Qs) + '</td><td class="angka">' + f(my.Qs) + '</td></tr>' +
      '<tr><td>W (kN)</td><td class="angka">' + f(rw.W) + '</td><td class="angka">' + f(my.W) + '</td></tr>' +
      '<tr><td>Q<sub>u</sub> (kN)</td><td class="angka">' + f(rw.Qu) + '</td><td class="angka">' + f(my.Qu) + '</td></tr>' +
      '<tr><td><strong>Q<sub>a</sub> (kN)</strong></td><td class="angka"><strong>' + f(rw.Qa) + '</strong></td><td class="angka"><strong>' + f(my.Qa) + '</strong></td></tr>' +
      '<tr><td>Q<sub>a</sub> (ton)</td><td class="angka">' + f(rw.Qa / KN_PER_TON) + '</td><td class="angka">' + f(my.Qa / KN_PER_TON) + '</td></tr>' +
      '</tbody></table></div>';
    h += '<p style="margin-top:14px">Selisih Q<sub>u</sub> kedua metode ' + f(selisih, 1) + '%' +
      (selisih > 20
        ? ', lebih dari 20%. Perbedaan terbesar ada pada ' + sumber + ' (' + f(Math.abs(sumber === 'tahanan ujung' ? dQp : dQs)) + ' kN).' +
          (sumber === 'tahanan ujung' && my.Lb / m.d < 10 ? ' Pada Meyerhof, q<sub>p</sub> sebanding dengan L<sub>b</sub>/d; tiang hanya tertanam ' + f(my.Lb) + ' m di lapisan pendukung, sehingga tahanan ujungnya kecil.' : '') +
          (sumber === 'tahanan selimut' ? ' Rumus selimut kedua metode berbeda koefisien dan cara memperlakukan lapisan lempung.' : '')
        : '. Kedua metode memberi hasil yang berdekatan.') + '</p>';

    // 5. Catatan
    h += '<h2>5. Catatan</h2><ul>' +
      '<li>Kepala tiang dianggap di muka tanah; nilai N dianggap sudah N₆₀.</li>' +
      '<li>Tidak memperhitungkan efek kelompok tiang, gesek negatif, maupun penurunan.</li>' +
      '<li>Reese &amp; Wright memakai N di lapisan ujung; Meyerhof memakai N rata-rata zona ujung. Karena itu kedua metode bisa sangat berbeda bila ujung tiang dekat batas lapisan.</li>' +
      semuaPeringatan.map(function (p) { return '<li>' + p + '</li>'; }).join('') +
      '</ul>';

    el.innerHTML = h;
  }

  // ---------- Tautan bagikan ----------
  function simpanKeHash() {
    try { history.replaceState(null, '', '#' + btoa(JSON.stringify(keadaan))); } catch (e) { /* abaikan */ }
  }
  function bacaHash() {
    try {
      if (location.hash.length > 1) {
        var o = JSON.parse(atob(location.hash.slice(1)));
        if (o && Array.isArray(o.lapisan)) return o;
      }
    } catch (e) { /* abaikan hash rusak */ }
    return null;
  }

  function perbarui() {
    var m = masukanHitung();
    var r = TiangBor.hitung(m);
    gambarProfil(m, r);
    gambarHasil(m, r);
    simpanKeHash();
  }

  function pasangPendengar() {
    ['d', 'L', 'SF', 'gammaBeton'].forEach(function (k) {
      $(k).addEventListener('input', function () { keadaan[k] = parseFloat($(k).value); perbarui(); });
    });
    $('perpindahan').addEventListener('change', function () { keadaan.perpindahan = $('perpindahan').value; perbarui(); });
    $('pakaiBerat').addEventListener('change', function () {
      keadaan.pakaiBerat = $('pakaiBerat').checked;
      $('gammaBeton').disabled = !keadaan.pakaiBerat;
      perbarui();
    });
    $('tambahLapisan').addEventListener('click', function () {
      var akhir = keadaan.lapisan[keadaan.lapisan.length - 1];
      keadaan.lapisan.push({ bawah: (akhir ? akhir.bawah : 0) + 3, jenis: 'pasir', N: akhir ? akhir.N : 10, cu: null });
      gambarTabelLapisan();
      perbarui();
    });
    $('muatContoh').addEventListener('click', function () { keadaan = salin(CONTOH); isiFormulir(); perbarui(); });
    $('bagikan').addEventListener('click', function () {
      simpanKeHash();
      var pesan = $('pesanBagikan');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () { pesan.textContent = 'Tautan disalin. Siapa pun yang membukanya akan melihat data yang sama.'; },
          function () { pesan.textContent = 'Salin tautan dari bilah alamat browser.'; });
      } else pesan.textContent = 'Salin tautan dari bilah alamat browser.';
    });
  }

  function mulai() {
    keadaan = bacaHash() || salin(CONTOH);
    isiFormulir();
    pasangPendengar();
    perbarui();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
  // KaTeX dimuat terpisah; gambar ulang rumus setelah siap.
  window.addEventListener('load', function () { if (window.katex) perbarui(); });
})();
