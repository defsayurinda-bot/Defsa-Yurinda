/* Tampilan kalkulator konsolidasi: formulir, diagram e–log σ', kurva penurunan–waktu, langkah hitungan. */
(function () {
  'use strict';

  var U = window.Umum;
  var $ = U.$, f = U.f, t = U.t, rumus = U.rumus, salin = U.salin;
  var CONTOH = {
    H: 4, e0: 1.1, Cc: 0.36, Cs: 0.06, s0: 60, sc: 60,
    modeDelta: '2:1', delta: 50, bentuk2: 'persegi', q: 150, B2: 3, L2: 3, z: 4,
    cv: 1.5, drainase: 'dua', t: 1
  };
  var ANGKA = ['H', 'e0', 'Cc', 'Cs', 's0', 'sc', 'delta', 'q', 'B2', 'L2', 'z', 'cv', 't'];
  var PILIHAN = ['modeDelta', 'bentuk2', 'drainase'];
  var keadaan;
  var log10 = function (x) { return Math.log(x) / Math.LN10; };

  function isiFormulir() {
    ANGKA.forEach(function (k) { $(k).value = keadaan[k]; });
    PILIHAN.forEach(function (k) { $(k).value = keadaan[k]; });
    aturAktif();
  }
  function aturAktif() {
    document.querySelectorAll('[data-mode]').forEach(function (el) {
      el.style.display = el.dataset.mode === keadaan.modeDelta ? '' : 'none';
    });
    $('L2').disabled = keadaan.bentuk2 === 'lajur';
  }

  // ---------- Diagram e–log σ' ----------
  function gambarDiagramE(m, r) {
    var W = 280, H = 230, kiri = 44, kanan = W - 12, atas = 14, bawah = H - 34;
    var el = $('diagramE');
    if (!r || r.galat.length) { el.innerHTML = '<p class="kecil redup">Lengkapi data untuk melihat diagram.</p>'; return; }
    var s0 = m.s0, sc = m.sc, s1 = r.s1;
    var eC = m.e0 - m.Cs * log10(Math.min(sc, s1) / s0);
    var e1 = s1 <= sc ? m.e0 - m.Cs * log10(s1 / s0) : eC - m.Cc * log10(s1 / sc);
    var xMin = log10(s0) - 0.3, xMaks = log10(Math.max(s1, sc)) + 0.3;
    var eMaks = m.e0 + 0.05 * Math.max(m.e0 - e1, 0.05), eMin = e1 - 0.25 * Math.max(m.e0 - e1, 0.05);
    var X = function (s) { return kiri + (log10(s) - xMin) / (xMaks - xMin) * (kanan - kiri); };
    var Y = function (e) { return atas + (eMaks - e) / (eMaks - eMin) * (bawah - atas); };
    var g = '<svg class="profil-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Diagram angka pori terhadap log tegangan efektif">';
    g += '<line x1="' + kiri + '" x2="' + kiri + '" y1="' + atas + '" y2="' + bawah + '" style="stroke:var(--teks-2)"/>';
    g += '<line x1="' + kiri + '" x2="' + kanan + '" y1="' + bawah + '" y2="' + bawah + '" style="stroke:var(--teks-2)"/>';
    // garis bantu σ'c
    if (sc > s0) g += '<line x1="' + X(sc) + '" x2="' + X(sc) + '" y1="' + atas + '" y2="' + bawah + '" style="stroke:var(--teks-2);stroke-dasharray:3 3"/>' +
      '<text x="' + X(sc) + '" y="' + (bawah + 26) + '" text-anchor="middle" font-size="10" style="fill:var(--teks-2)">σ\'c</text>';
    // jalur
    var titik = [[s0, m.e0]];
    if (s1 > sc && sc > s0) titik.push([sc, eC]);
    titik.push([s1, e1]);
    g += '<polyline points="' + titik.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '" style="fill:none;stroke:var(--aksen);stroke-width:2.5"/>';
    titik.forEach(function (p) { g += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="3.5" style="fill:var(--aksen)"/>'; });
    // label
    [[s0, 'σ\'0'], [s1, 'σ\'0+Δσ\'']].forEach(function (p) {
      g += '<text x="' + X(p[0]) + '" y="' + (bawah + 14) + '" text-anchor="middle" font-size="10" style="fill:var(--teks)">' + p[1] + '</text>';
    });
    g += '<text x="' + (kiri - 6) + '" y="' + (Y(m.e0) + 4) + '" text-anchor="end" font-size="10" style="fill:var(--teks)">' + f(m.e0) + '</text>';
    g += '<text x="' + (kiri - 6) + '" y="' + (Y(e1) + 4) + '" text-anchor="end" font-size="10" style="fill:var(--teks)">' + f(e1) + '</text>';
    g += '<text x="12" y="' + ((atas + bawah) / 2) + '" font-size="11" transform="rotate(-90 12 ' + ((atas + bawah) / 2) + ')" text-anchor="middle" style="fill:var(--teks-2)">e</text>';
    g += '<text x="' + kanan + '" y="' + (H - 4) + '" text-anchor="end" font-size="10" style="fill:var(--teks-2)">log σ\'</text>';
    g += '</svg>';
    el.innerHTML = g;
  }

  // ---------- Kurva penurunan–waktu ----------
  function kurvaWaktu(m, r) {
    var W = 640, H = 260, kiri = 56, kanan = W - 16, atas = 16, bawah = H - 40;
    var tMaks = Math.max(r.t90 * 1.6, m.t > 0 ? m.t * 1.1 : 0);
    var ScMm = r.Sc * 1000;
    var X = function (tt) { return kiri + tt / tMaks * (kanan - kiri); };
    var Y = function (s) { return atas + s / (ScMm * 1.08) * (bawah - atas); };
    var titik = [];
    for (var i = 0; i <= 120; i++) {
      var tt = tMaks * i / 120;
      titik.push(X(tt) + ',' + Y(Konsolidasi.derajatU(m.cv * tt / (r.Hdr * r.Hdr)) * ScMm));
    }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="Kurva penurunan terhadap waktu">';
    // sumbu dan kisi
    for (var k = 0; k <= 4; k++) {
      var sv = ScMm * k / 4, y = Y(sv);
      s += '<line x1="' + kiri + '" x2="' + kanan + '" y1="' + y + '" y2="' + y + '" style="stroke:var(--garis)"/>';
      s += '<text x="' + (kiri - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" style="fill:var(--teks-2)">' + f(sv, 0) + '</text>';
    }
    for (var j = 0; j <= 4; j++) {
      var tv = tMaks * j / 4;
      s += '<text x="' + X(tv) + '" y="' + (bawah + 18) + '" text-anchor="middle" font-size="11" style="fill:var(--teks-2)">' + f(tv, 1) + '</text>';
    }
    s += '<text x="' + ((kiri + kanan) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11" style="fill:var(--teks-2)">Waktu (tahun)</text>';
    s += '<text x="14" y="' + ((atas + bawah) / 2) + '" font-size="11" transform="rotate(-90 14 ' + ((atas + bawah) / 2) + ')" text-anchor="middle" style="fill:var(--teks-2)">Penurunan (mm)</text>';
    s += '<polyline points="' + titik.join(' ') + '" style="fill:none;stroke:var(--aksen);stroke-width:2.5"/>';
    // penanda t50, t90, t
    var tanda = [[r.t50, 0.5 * ScMm, 't₅₀'], [r.t90, 0.9 * ScMm, 't₉₀']];
    if (r.hasilT) tanda.push([m.t, r.hasilT.St * 1000, 't']);
    tanda.forEach(function (p) {
      s += '<line x1="' + X(p[0]) + '" x2="' + X(p[0]) + '" y1="' + atas + '" y2="' + Y(p[1]) + '" style="stroke:var(--teks-2);stroke-dasharray:3 3"/>';
      s += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="4" style="fill:' + (p[2] === 't' ? 'var(--teks)' : 'var(--aksen)') + '"/>';
      s += '<text x="' + (X(p[0]) + 6) + '" y="' + (Y(p[1]) + 16) + '" font-size="11" font-weight="700" style="fill:var(--teks)">' + p[2] + '</text>';
    });
    s += '</svg>';
    return s;
  }

  // ---------- Hasil ----------
  function gambarHasil(m, r) {
    var el = $('hasil');
    if (r.galat.length) {
      el.innerHTML = '<h2>Hasil</h2>' + r.galat.map(function (g) { return '<div class="catatan galat">' + g + '</div>'; }).join('');
      return;
    }
    var T = r.T, h = '';
    var namaKasus = { NC: 'Terkonsolidasi normal (NC)', OC1: 'Overkonsolidasi, σ\'0 + Δσ\' ≤ σ\'c', OC2: 'Overkonsolidasi, σ\'0 + Δσ\' > σ\'c' }[r.kasus];

    h += '<h2>Ringkasan</h2><div class="ringkasan">' +
      '<div class="kartu"><div class="redup kecil" style="font-weight:700">Penurunan konsolidasi primer</div><div class="nilai-besar">' + f(r.Sc * 1000, 0) + ' <small>mm</small></div><div class="redup kecil">' + namaKasus + '</div></div>' +
      '<div class="kartu"><div class="redup kecil" style="font-weight:700">Waktu U = 90%</div><div class="nilai-besar">' + f(r.t90, 2) + ' <small>tahun</small></div><div class="redup kecil">t<sub>50</sub> = ' + f(r.t50, 2) + ' tahun</div></div>' +
      (r.hasilT ? '<div class="kartu"><div class="redup kecil" style="font-weight:700">Setelah ' + f(m.t, 1) + ' tahun</div><div class="nilai-besar">' + f(r.hasilT.St * 1000, 0) + ' <small>mm</small></div><div class="redup kecil">U = ' + f(r.hasilT.U * 100, 1) + '%</div></div>' : '') +
      '</div>';
    r.peringatan.forEach(function (p) { h += '<div class="catatan">' + p + '</div>'; });
    h += '<div class="kartu" style="margin:16px 0">' + kurvaWaktu(m, r) + '</div>';

    // 1. Diketahui
    h += '<h2>1. Diketahui</h2><div class="tabel-gulir"><table><thead><tr><th>Simbol</th><th>Besaran</th><th class="angka">Nilai</th><th>Satuan</th></tr></thead><tbody>' +
      '<tr><td><i>H</i></td><td>Tebal lapisan lempung</td><td class="angka">' + f(m.H) + '</td><td>m</td></tr>' +
      '<tr><td><i>e</i><sub>0</sub></td><td>Angka pori awal</td><td class="angka">' + f(m.e0, 3) + '</td><td>–</td></tr>' +
      '<tr><td><i>C</i><sub>c</sub></td><td>Indeks kompresi</td><td class="angka">' + f(m.Cc, 3) + '</td><td>–</td></tr>' +
      '<tr><td><i>C</i><sub>s</sub></td><td>Indeks pengembangan</td><td class="angka">' + f(m.Cs, 3) + '</td><td>–</td></tr>' +
      '<tr><td>σ\'<sub>0</sub></td><td>Tegangan efektif awal di tengah lapisan</td><td class="angka">' + f(m.s0, 1) + '</td><td>kPa</td></tr>' +
      '<tr><td>σ\'<sub>c</sub></td><td>Tegangan prakonsolidasi</td><td class="angka">' + f(m.sc, 1) + '</td><td>kPa</td></tr>' +
      (T.mode === 'manual' ? '<tr><td>Δσ\'</td><td>Tambahan tegangan</td><td class="angka">' + f(T.delta, 1) + '</td><td>kPa</td></tr>' :
        '<tr><td><i>q</i></td><td>Tekanan pondasi</td><td class="angka">' + f(m.q, 1) + '</td><td>kPa</td></tr>' +
        '<tr><td><i>B</i>' + (T.lajur ? '' : ', <i>L</i>') + '</td><td>Ukuran pondasi' + (T.lajur ? ' (lajur)' : '') + '</td><td class="angka">' + f(m.B2) + (T.lajur ? '' : ' × ' + f(m.L2)) + '</td><td>m</td></tr>' +
        '<tr><td><i>z</i></td><td>Dasar pondasi ke tengah lapisan</td><td class="angka">' + f(m.z) + '</td><td>m</td></tr>') +
      '<tr><td><i>c</i><sub>v</sub></td><td>Koefisien konsolidasi</td><td class="angka">' + f(m.cv, 3) + '</td><td>m²/tahun</td></tr>' +
      '</tbody></table></div>';

    // 2. Ditanya
    h += '<h2>2. Ditanya</h2><ol><li>Penurunan konsolidasi primer S<sub>c</sub>.</li><li>Waktu untuk U = 50% dan 90%' + (r.hasilT ? ', serta penurunan setelah ' + f(m.t, 1) + ' tahun' : '') + '.</li></ol>';

    // 3. Penyelesaian
    h += '<h2>3. Penyelesaian</h2>';
    h += '<div class="langkah"><h4>a. Tambahan tegangan di tengah lapisan</h4>';
    if (T.mode === 'manual') h += '<p>Δσ\' = ' + f(T.delta, 1) + ' kPa (diisi langsung).</p>';
    else if (T.lajur) h += rumus('\\Delta\\sigma\' = \\dfrac{q\\,B}{B + z} = \\dfrac{' + t(m.q, 1) + '\\times' + t(m.B2) + '}{' + t(m.B2) + ' + ' + t(m.z) + '} = ' + t(T.delta) + '\\ \\text{kPa}');
    else h += rumus('\\Delta\\sigma\' = \\dfrac{q\\,B\\,L}{(B + z)(L + z)} = \\dfrac{' + t(m.q, 1) + '\\times' + t(m.B2) + '\\times' + t(m.L2) + '}{(' + t(m.B2) + ' + ' + t(m.z) + ')(' + t(m.L2) + ' + ' + t(m.z) + ')} = ' + t(T.delta) + '\\ \\text{kPa}');
    h += rumus('\\sigma\'_0 + \\Delta\\sigma\' = ' + t(m.s0, 1) + ' + ' + t(T.delta) + ' = ' + t(r.s1) + '\\ \\text{kPa}') + '</div>';

    h += '<div class="langkah"><h4>b. Kondisi konsolidasi</h4>' +
      rumus('OCR = \\dfrac{\\sigma\'_c}{\\sigma\'_0} = \\dfrac{' + t(m.sc, 1) + '}{' + t(m.s0, 1) + '} = ' + t(r.OCR)) +
      '<p>' + namaKasus + '.</p></div>';

    var a = '\\dfrac{' + t(m.H) + '}{1 + ' + t(m.e0, 3) + '}';
    h += '<div class="langkah"><h4>c. Besar penurunan</h4>';
    if (r.kasus === 'NC') {
      h += rumus('S_c = \\dfrac{C_c H}{1 + e_0}\\log\\dfrac{\\sigma\'_0 + \\Delta\\sigma\'}{\\sigma\'_0} = ' + t(m.Cc, 3) + '\\times' + a + '\\log\\dfrac{' + t(r.s1) + '}{' + t(m.s0, 1) + '} = ' + t(r.Sc, 4) + '\\ \\text{m}');
    } else if (r.kasus === 'OC1') {
      h += rumus('S_c = \\dfrac{C_s H}{1 + e_0}\\log\\dfrac{\\sigma\'_0 + \\Delta\\sigma\'}{\\sigma\'_0} = ' + t(m.Cs, 3) + '\\times' + a + '\\log\\dfrac{' + t(r.s1) + '}{' + t(m.s0, 1) + '} = ' + t(r.Sc, 4) + '\\ \\text{m}');
    } else {
      h += rumus('S_c = \\dfrac{C_s H}{1 + e_0}\\log\\dfrac{\\sigma\'_c}{\\sigma\'_0} + \\dfrac{C_c H}{1 + e_0}\\log\\dfrac{\\sigma\'_0 + \\Delta\\sigma\'}{\\sigma\'_c}') +
        rumus('= ' + t(m.Cs, 3) + '\\times' + a + '\\log\\dfrac{' + t(m.sc, 1) + '}{' + t(m.s0, 1) + '} + ' + t(m.Cc, 3) + '\\times' + a + '\\log\\dfrac{' + t(r.s1) + '}{' + t(m.sc, 1) + '}') +
        rumus('= ' + t(r.bagian.oc, 4) + ' + ' + t(r.bagian.nc, 4) + ' = ' + t(r.Sc, 4) + '\\ \\text{m}');
    }
    h += '<p>S<sub>c</sub> = ' + f(r.Sc * 1000, 1) + ' mm.</p></div>';

    h += '<div class="langkah"><h4>d. Laju konsolidasi</h4>' +
      '<p>Drainase ' + (m.drainase === 'dua' ? 'dua arah, sehingga H<sub>dr</sub> = H/2' : 'satu arah, sehingga H<sub>dr</sub> = H') + ' = ' + f(r.Hdr) + ' m.</p>' +
      rumus('t = \\dfrac{T_v\\,H_{dr}^2}{c_v}\\qquad U = 1 - \\sum_{m=0}^{\\infty}\\dfrac{2}{M^2}e^{-M^2 T_v},\\ M = \\tfrac{(2m+1)\\pi}{2}') +
      rumus('t_{50} = \\dfrac{0{,}197\\times' + t(r.Hdr) + '^2}{' + t(m.cv, 3) + '} = ' + t(r.t50) + '\\ \\text{tahun}') +
      rumus('t_{90} = \\dfrac{0{,}848\\times' + t(r.Hdr) + '^2}{' + t(m.cv, 3) + '} = ' + t(r.t90) + '\\ \\text{tahun}');
    if (r.hasilT) {
      h += rumus('T_v = \\dfrac{c_v t}{H_{dr}^2} = \\dfrac{' + t(m.cv, 3) + '\\times' + t(m.t, 1) + '}{' + t(r.Hdr) + '^2} = ' + t(r.hasilT.Tv, 4) + '\\;\\Rightarrow\\; U = ' + t(r.hasilT.U * 100, 1) + '\\%') +
        rumus('S_t = U\\,S_c = ' + t(r.hasilT.U, 4) + '\\times' + t(r.Sc * 1000, 1) + ' = ' + t(r.hasilT.St * 1000, 1) + '\\ \\text{mm}');
    }
    h += '<p class="ket">Nilai 0,197 dan 0,848 dibulatkan untuk ditampilkan; hitungan memakai deret eksak.</p></div>';

    // 4. Hasil dan penjelasan
    h += '<h2>4. Hasil dan penjelasan</h2><div class="tabel-gulir"><table><thead><tr><th>Besaran</th><th class="angka">Nilai</th></tr></thead><tbody>' +
      '<tr><td>Δσ\' di tengah lapisan</td><td class="angka">' + f(T.delta) + ' kPa</td></tr>' +
      '<tr><td>OCR</td><td class="angka">' + f(r.OCR) + '</td></tr>' +
      '<tr><td>S<sub>c</sub></td><td class="angka">' + f(r.Sc * 1000, 1) + ' mm</td></tr>' +
      '<tr><td>t<sub>50</sub> / t<sub>90</sub></td><td class="angka">' + f(r.t50) + ' / ' + f(r.t90) + ' tahun</td></tr>' +
      (r.hasilT ? '<tr><td>S setelah ' + f(m.t, 1) + ' tahun</td><td class="angka">' + f(r.hasilT.St * 1000, 1) + ' mm (U = ' + f(r.hasilT.U * 100, 1) + '%)</td></tr>' : '') +
      '</tbody></table></div>';
    var penjelasan = r.kasus === 'OC1'
      ? 'Tegangan akhir masih di bawah σ\'c, sehingga tanah hanya mengalami rekompresi dengan kemiringan C<sub>s</sub>. Penurunannya kecil dibandingkan bila tanah terkonsolidasi normal.'
      : r.kasus === 'OC2'
        ? 'Tegangan akhir melewati σ\'c. Bagian rekompresi (C<sub>s</sub>) menyumbang ' + f(r.bagian.oc / r.Sc * 100, 1) + '% dan bagian kompresi murni (C<sub>c</sub>) ' + f(r.bagian.nc / r.Sc * 100, 1) + '% dari total penurunan.'
        : 'Tanah terkonsolidasi normal, sehingga seluruh penambahan tegangan menghasilkan kompresi dengan kemiringan C<sub>c</sub>.';
    h += '<p style="margin-top:14px">' + penjelasan + ' Waktu konsolidasi sebanding dengan kuadrat panjang lintasan drainase: ' +
      (m.drainase === 'dua' ? 'bila drainase hanya satu arah, waktu yang dibutuhkan menjadi empat kali lebih lama.' : 'bila ada lapisan lolos air di kedua sisi, waktunya menjadi seperempatnya.') + '</p>';

    // 5. Catatan
    h += '<h2>5. Catatan</h2><ul>' +
      '<li>Lapisan dihitung sebagai satu lapisan dengan tegangan di tengahnya. Untuk lapisan tebal, bagi menjadi beberapa sublapisan agar lebih teliti.</li>' +
      '<li>Hanya penurunan konsolidasi primer. Penurunan segera dan penurunan sekunder tidak termasuk.</li>' +
      '<li>Beban dianggap bekerja seketika dan c<sub>v</sub> dianggap konstan.</li>' +
      r.peringatan.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>';

    el.innerHTML = h;
  }

  function perbarui() {
    var m = salin(keadaan);
    var r = Konsolidasi.hitung(m);
    gambarDiagramE(m, r);
    gambarHasil(m, r);
    U.simpanKeHash(keadaan);
  }

  function mulai() {
    keadaan = U.bacaHash(function (o) { return typeof o.modeDelta === 'string' && U.tanpaHTML(o); }) || salin(CONTOH);
    isiFormulir();
    ANGKA.forEach(function (k) {
      $(k).addEventListener('input', function () { keadaan[k] = parseFloat($(k).value); perbarui(); });
    });
    PILIHAN.forEach(function (k) {
      $(k).addEventListener('change', function () { keadaan[k] = $(k).value; aturAktif(); perbarui(); });
    });
    $('muatContoh').addEventListener('click', function () { keadaan = salin(CONTOH); isiFormulir(); perbarui(); });
    $('bagikan').addEventListener('click', function () { U.simpanKeHash(keadaan); U.salinTautan($('pesanBagikan')); });
    perbarui();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
})();
