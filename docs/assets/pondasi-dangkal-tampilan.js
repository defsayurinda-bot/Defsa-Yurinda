/* Tampilan kalkulator pondasi dangkal. */
(function () {
  'use strict';

  var U = window.Umum;
  var $ = U.$, f = U.f, t = U.t, rumus = U.rumus, salin = U.salin, KN_PER_TON = U.KN_PER_TON;
  var CONTOH = {
    bentuk: 'persegi', B: 2, L: 2, Df: 1.5, c: 10, phi: 30, gamma: 18,
    adaMAT: false, dw: 3, gammaSat: 19.5, FS: 3
  };
  var ANGKA = ['B', 'L', 'Df', 'c', 'phi', 'gamma', 'dw', 'gammaSat', 'FS'];
  var NAMA_BENTUK = { lajur: 'lajur', persegi: 'bujur sangkar', 'persegi-panjang': 'persegi panjang', lingkaran: 'lingkaran' };
  var keadaan;

  function isiFormulir() {
    ANGKA.forEach(function (k) { $(k).value = keadaan[k]; });
    $('bentuk').value = keadaan.bentuk;
    $('adaMAT').checked = keadaan.adaMAT;
    aturAktif();
  }

  function aturAktif() {
    $('L').disabled = keadaan.bentuk !== 'persegi-panjang';
    $('dw').disabled = $('gammaSat').disabled = !keadaan.adaMAT;
    $('labelB').textContent = keadaan.bentuk === 'lingkaran' ? 'Diameter, B (m)' : 'Lebar, B (m)';
  }

  function masukan() {
    var m = salin(keadaan);
    if (m.bentuk !== 'persegi-panjang') m.L = m.B;
    return m;
  }

  // ---------- Sketsa penampang ----------
  function gambarSketsa(m, r) {
    var W = 280, H = 300, x0 = 20, lebar = W - 40, tanahY = 60;
    var skala = Math.min(150 / Math.max(m.B, 0.1), 180 / Math.max(m.Df + m.B * 1.5, 0.5));
    var yDasar = tanahY + m.Df * skala, lb = m.B * skala, xB = W / 2 - lb / 2;
    var s = '<svg class="profil-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sketsa penampang pondasi">';
    s += '<rect x="' + x0 + '" y="' + tanahY + '" width="' + lebar + '" height="' + (H - tanahY - 10) + '" style="fill:var(--pasir)"/>';
    if (m.adaMAT && isFinite(m.dw)) {
      var yM = tanahY + m.dw * skala;
      if (yM < H - 10) {
        s += '<rect x="' + x0 + '" y="' + yM + '" width="' + lebar + '" height="' + (H - 10 - yM) + '" style="fill:#4a90c2;opacity:.18"/>';
        s += '<line x1="' + x0 + '" x2="' + (x0 + lebar) + '" y1="' + yM + '" y2="' + yM + '" style="stroke:#4a90c2;stroke-width:1.5;stroke-dasharray:6 4"/>';
        s += '<path d="M' + (x0 + 16) + ' ' + (yM - 10) + ' l6 9 l6 -9 z" style="fill:#4a90c2"/>';
        s += '<text x="' + (x0 + 34) + '" y="' + (yM - 3) + '" font-size="11" style="fill:var(--teks)">MAT</text>';
      }
    }
    // kolom dan telapak
    var tebalPelat = Math.min(0.4 * skala, 22);
    s += '<rect x="' + (W / 2 - 10) + '" y="' + (tanahY - 40) + '" width="20" height="' + (yDasar - tebalPelat - tanahY + 40) + '" style="fill:var(--tiang);stroke:var(--teks)"/>';
    s += '<rect x="' + xB + '" y="' + (yDasar - tebalPelat) + '" width="' + lb + '" height="' + tebalPelat + '" style="fill:var(--tiang);stroke:var(--teks)"/>';
    s += '<line x1="' + x0 + '" x2="' + (x0 + lebar) + '" y1="' + tanahY + '" y2="' + tanahY + '" style="stroke:var(--teks);stroke-width:2"/>';
    // beban
    s += '<line x1="' + (W / 2) + '" x2="' + (W / 2) + '" y1="4" y2="' + (tanahY - 44) + '" style="stroke:var(--aksen);stroke-width:2.5"/>';
    s += '<path d="M' + (W / 2 - 6) + ' ' + (tanahY - 50) + ' l6 9 l6 -9 z" style="fill:var(--aksen)"/>';
    // ukuran
    s += '<line x1="' + xB + '" x2="' + (xB + lb) + '" y1="' + (yDasar + 14) + '" y2="' + (yDasar + 14) + '" style="stroke:var(--teks)"/>';
    s += '<text x="' + (W / 2) + '" y="' + (yDasar + 28) + '" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--teks)">B = ' + f(m.B) + ' m</text>';
    if (m.Df > 0) {
      var xD = xB - 12;
      s += '<line x1="' + xD + '" x2="' + xD + '" y1="' + tanahY + '" y2="' + yDasar + '" style="stroke:var(--teks)"/>';
      s += '<text x="' + (xD - 4) + '" y="' + ((tanahY + yDasar) / 2 + 4) + '" text-anchor="end" font-size="12" font-weight="700" style="fill:var(--teks)">D<tspan font-size="9" dy="3">f</tspan><tspan dy="-3"> = ' + f(m.Df) + ' m</tspan></text>';
    }
    if (r && !r.galat.length) {
      s += '<text x="' + (W - 22) + '" y="' + (H - 18) + '" text-anchor="end" font-size="11" style="fill:var(--teks)">c\' = ' + f(m.c, 0) + ' kPa · φ\' = ' + f(m.phi, 0) + '°</text>';
    }
    s += '</svg>';
    $('sketsa').innerHTML = s;
  }

  // ---------- Hasil ----------
  function gambarHasil(m, r) {
    var el = $('hasil');
    if (r.galat.length) {
      el.innerHTML = '<h2>Hasil</h2>' + r.galat.map(function (g) { return '<div class="catatan galat">' + g + '</div>'; }).join('');
      return;
    }
    var N = r.N, S = r.S, D = r.D, A = r.A, phi = m.phi;
    var lajur = m.bentuk === 'lajur';
    var satuanQ = lajur ? 'kN/m' : 'kN';
    var h = '';

    h += '<h2>Ringkasan</h2><div class="ringkasan">' +
      '<div class="kartu"><div class="redup kecil" style="font-weight:700">Kapasitas dukung ultimit</div><div class="nilai-besar">' + f(r.qu, 0) + ' <small>kPa</small></div><div class="redup kecil">q<sub>u</sub></div></div>' +
      '<div class="kartu"><div class="redup kecil" style="font-weight:700">Kapasitas dukung izin</div><div class="nilai-besar">' + f(r.qall, 0) + ' <small>kPa</small></div><div class="redup kecil">q<sub>all</sub> = q<sub>u</sub>/FS · net ' + f(r.qallNet, 0) + ' kPa</div></div>' +
      '<div class="kartu"><div class="redup kecil" style="font-weight:700">Beban izin</div><div class="nilai-besar">' + f(r.Qall, 0) + ' <small>' + satuanQ + '</small></div><div class="redup kecil">≈ ' + f(r.Qall / KN_PER_TON, 1) + (lajur ? ' ton/m' : ' ton') + '</div></div>' +
      '</div>';
    r.peringatan.forEach(function (p) { h += '<div class="catatan">' + p + '</div>'; });

    // 1. Diketahui
    h += '<h2>1. Diketahui</h2><div class="tabel-gulir"><table><thead><tr><th>Simbol</th><th>Besaran</th><th class="angka">Nilai</th><th>Satuan</th></tr></thead><tbody>' +
      '<tr><td><i>B</i></td><td>' + (m.bentuk === 'lingkaran' ? 'Diameter' : 'Lebar') + ' pondasi (' + NAMA_BENTUK[m.bentuk] + ')</td><td class="angka">' + f(m.B) + '</td><td>m</td></tr>' +
      (m.bentuk === 'persegi-panjang' ? '<tr><td><i>L</i></td><td>Panjang pondasi</td><td class="angka">' + f(m.L) + '</td><td>m</td></tr>' : '') +
      '<tr><td><i>D<sub>f</sub></i></td><td>Kedalaman dasar pondasi</td><td class="angka">' + f(m.Df) + '</td><td>m</td></tr>' +
      '<tr><td><i>c\'</i></td><td>Kohesi</td><td class="angka">' + f(m.c, 1) + '</td><td>kPa</td></tr>' +
      '<tr><td>φ\'</td><td>Sudut geser dalam</td><td class="angka">' + f(phi, 1) + '</td><td>°</td></tr>' +
      '<tr><td>γ</td><td>Berat volume tanah</td><td class="angka">' + f(m.gamma, 1) + '</td><td>kN/m³</td></tr>' +
      (m.adaMAT ? '<tr><td><i>d<sub>w</sub></i></td><td>Kedalaman muka air tanah</td><td class="angka">' + f(m.dw) + '</td><td>m</td></tr>' +
        '<tr><td>γ<sub>sat</sub></td><td>Berat volume jenuh</td><td class="angka">' + f(m.gammaSat, 1) + '</td><td>kN/m³</td></tr>' +
        '<tr><td>γ<sub>w</sub></td><td>Berat volume air</td><td class="angka">9,81</td><td>kN/m³</td></tr>' : '') +
      '<tr><td><i>FS</i></td><td>Faktor keamanan</td><td class="angka">' + f(m.FS, 1) + '</td><td>–</td></tr>' +
      '</tbody></table></div>';

    // 2. Ditanya
    h += '<h2>2. Ditanya</h2><ol><li>Kapasitas dukung ultimit q<sub>u</sub>.</li><li>Kapasitas dukung izin q<sub>all</sub> dan beban izin Q<sub>all</sub>.</li></ol>';

    // 3. Penyelesaian
    h += '<h2>3. Penyelesaian</h2>';
    h += rumus('q_u = c\'\\,N_c F_{cs} F_{cd} + q\\,N_q F_{qs} F_{qd} + \\tfrac{1}{2}\\gamma B N_\\gamma F_{\\gamma s} F_{\\gamma d}');

    h += '<div class="langkah"><h4>a. Faktor daya dukung (φ\' = ' + f(phi, 1) + '°)</h4>' +
      rumus('N_q = \\tan^2\\!\\left(45^\\circ + \\tfrac{\\phi\'}{2}\\right) e^{\\pi \\tan\\phi\'} = ' + t(N.Nq, 3)) +
      (phi === 0 ? rumus('N_c = \\pi + 2 = ' + t(N.Nc, 3) + '\\quad(\\phi\' = 0)')
        : rumus('N_c = (N_q - 1)\\cot\\phi\' = (' + t(N.Nq, 3) + ' - 1)\\cot ' + t(phi, 1) + '^\\circ = ' + t(N.Nc, 3))) +
      rumus('N_\\gamma = 2(N_q + 1)\\tan\\phi\' = 2(' + t(N.Nq, 3) + ' + 1)\\tan ' + t(phi, 1) + '^\\circ = ' + t(N.Ng, 3)) + '</div>';

    var bl = lajur ? '0' : (m.bentuk === 'persegi-panjang' ? '\\tfrac{' + t(m.B) + '}{' + t(m.L) + '}' : '1');
    h += '<div class="langkah"><h4>b. Faktor bentuk (De Beer, 1970)</h4>' +
      '<p class="ket">B/L = ' + f(r.BL, 3) + (lajur ? ' untuk pondasi lajur' : m.bentuk === 'lingkaran' ? ' (lingkaran: B = L = diameter)' : '') + '.</p>' +
      rumus('F_{cs} = 1 + \\tfrac{B}{L}\\tfrac{N_q}{N_c} = 1 + ' + bl + '\\times\\tfrac{' + t(N.Nq, 3) + '}{' + t(N.Nc, 3) + '} = ' + t(S.Fcs, 3)) +
      rumus('F_{qs} = 1 + \\tfrac{B}{L}\\tan\\phi\' = ' + t(S.Fqs, 3) + '\\qquad F_{\\gamma s} = 1 - 0{,}4\\tfrac{B}{L} = ' + t(S.Fgs, 3)) + '</div>';

    var kTeks = D.pakaiAtan ? '\\tan^{-1}\\!\\left(\\tfrac{D_f}{B}\\right) = \\tan^{-1}\\!\\left(\\tfrac{' + t(m.Df) + '}{' + t(m.B) + '}\\right) = ' + t(D.k, 4) + '\\ \\text{rad}'
      : '\\tfrac{D_f}{B} = \\tfrac{' + t(m.Df) + '}{' + t(m.B) + '} = ' + t(D.k, 4);
    h += '<div class="langkah"><h4>c. Faktor kedalaman (Hansen, 1970)</h4>' +
      '<p class="ket">D<sub>f</sub>/B ' + (D.pakaiAtan ? '> 1, jadi dipakai tan⁻¹(D<sub>f</sub>/B)' : '≤ 1') + ':</p>' + rumus('k = ' + kTeks) +
      (phi === 0
        ? rumus('F_{cd} = 1 + 0{,}4k = ' + t(D.Fcd, 3) + '\\qquad F_{qd} = 1\\qquad F_{\\gamma d} = 1')
        : rumus('F_{qd} = 1 + 2\\tan\\phi\'(1 - \\sin\\phi\')^2 k = ' + t(D.Fqd, 3)) +
          rumus('F_{cd} = F_{qd} - \\dfrac{1 - F_{qd}}{N_c \\tan\\phi\'} = ' + t(D.Fcd, 3) + '\\qquad F_{\\gamma d} = 1')) + '</div>';

    h += '<div class="langkah"><h4>d. Tekanan di dasar pondasi dan γ suku ketiga</h4>';
    if (A.kasus === 1) {
      h += '<p>Muka air tanah di atas dasar pondasi (d<sub>w</sub> ≤ D<sub>f</sub>). Di bawah MAT dipakai γ\' = γ<sub>sat</sub> − γ<sub>w</sub> = ' + f(A.gEf) + ' kN/m³.</p>' +
        rumus('q = \\gamma d_w + \\gamma\'(D_f - d_w) = ' + t(m.gamma, 1) + '\\times' + t(m.dw) + ' + ' + t(A.gEf) + '\\times(' + t(m.Df) + ' - ' + t(m.dw) + ') = ' + t(A.q) + '\\ \\text{kPa}') +
        rumus('\\gamma_{\\text{suku 3}} = \\gamma\' = ' + t(A.gammaSuku3) + '\\ \\text{kN/m}^3');
    } else if (A.kasus === 2) {
      h += '<p>Muka air tanah di antara D<sub>f</sub> dan D<sub>f</sub> + B, d = ' + f(A.d) + ' m di bawah dasar pondasi.</p>' +
        rumus('q = \\gamma D_f = ' + t(m.gamma, 1) + '\\times' + t(m.Df) + ' = ' + t(A.q) + '\\ \\text{kPa}') +
        rumus('\\bar\\gamma = \\gamma\' + \\tfrac{d}{B}(\\gamma - \\gamma\') = ' + t(A.gEf) + ' + \\tfrac{' + t(A.d) + '}{' + t(m.B) + '}(' + t(m.gamma, 1) + ' - ' + t(A.gEf) + ') = ' + t(A.gammaSuku3) + '\\ \\text{kN/m}^3');
    } else {
      h += '<p>' + (m.adaMAT ? 'Muka air tanah berada di bawah D<sub>f</sub> + B, sehingga tidak berpengaruh.' : 'Tidak ada muka air tanah di zona pengaruh.') + '</p>' +
        rumus('q = \\gamma D_f = ' + t(m.gamma, 1) + '\\times' + t(m.Df) + ' = ' + t(A.q) + '\\ \\text{kPa}\\qquad \\gamma_{\\text{suku 3}} = ' + t(A.gammaSuku3, 1) + '\\ \\text{kN/m}^3');
    }
    h += '</div>';

    h += '<div class="langkah"><h4>e. Kapasitas dukung ultimit</h4>' +
      rumus('\\text{Suku 1} = ' + t(m.c, 1) + '\\times' + t(N.Nc, 3) + '\\times' + t(S.Fcs, 3) + '\\times' + t(D.Fcd, 3) + ' = ' + t(r.suku1) + '\\ \\text{kPa}') +
      rumus('\\text{Suku 2} = ' + t(A.q) + '\\times' + t(N.Nq, 3) + '\\times' + t(S.Fqs, 3) + '\\times' + t(D.Fqd, 3) + ' = ' + t(r.suku2) + '\\ \\text{kPa}') +
      rumus('\\text{Suku 3} = \\tfrac{1}{2}\\times' + t(A.gammaSuku3) + '\\times' + t(m.B) + '\\times' + t(N.Ng, 3) + '\\times' + t(S.Fgs, 3) + '\\times 1 = ' + t(r.suku3) + '\\ \\text{kPa}') +
      rumus('q_u = ' + t(r.suku1) + ' + ' + t(r.suku2) + ' + ' + t(r.suku3) + ' = ' + t(r.qu) + '\\ \\text{kPa}') + '</div>';

    var luasTeks = lajur ? 'B = ' + t(m.B) + '\\ \\text{m}^2/\\text{m}' : m.bentuk === 'lingkaran' ? '\\tfrac{\\pi}{4}B^2 = ' + t(r.luas, 3) + '\\ \\text{m}^2' : 'B \\times L = ' + t(r.luas, 3) + '\\ \\text{m}^2';
    h += '<div class="langkah"><h4>f. Kapasitas dukung dan beban izin</h4>' +
      rumus('q_{all} = \\dfrac{q_u}{FS} = \\dfrac{' + t(r.qu) + '}{' + t(m.FS, 1) + '} = ' + t(r.qall) + '\\ \\text{kPa}') +
      rumus('q_{all,net} = \\dfrac{q_u - q}{FS} = \\dfrac{' + t(r.qu) + ' - ' + t(A.q) + '}{' + t(m.FS, 1) + '} = ' + t(r.qallNet) + '\\ \\text{kPa}') +
      rumus('A = ' + luasTeks) +
      rumus('Q_{all} = q_{all}\\,A = ' + t(r.qall) + '\\times' + t(r.luas, 3) + ' = ' + t(r.Qall) + '\\ \\text{' + satuanQ + '}') + '</div>';

    // 4. Hasil dan penjelasan
    var suku = [['c\' N<sub>c</sub> (kohesi)', r.suku1], ['q N<sub>q</sub> (tanah di atas dasar)', r.suku2], ['½ γ B N<sub>γ</sub> (lebar pondasi)', r.suku3]];
    var dominan = suku.slice().sort(function (a, b) { return b[1] - a[1]; })[0];
    h += '<h2>4. Hasil dan penjelasan</h2><div class="tabel-gulir"><table><thead><tr><th>Suku</th><th class="angka">Nilai (kPa)</th><th class="angka">Porsi</th><th style="width:40%"></th></tr></thead><tbody>' +
      suku.map(function (s) {
        var p = r.qu > 0 ? s[1] / r.qu * 100 : 0;
        return '<tr><td>' + s[0] + '</td><td class="angka">' + f(s[1]) + '</td><td class="angka">' + f(p, 1) + '%</td><td><div class="batang" style="width:' + Math.max(p, 0.5) + '%"></div></td></tr>';
      }).join('') +
      '</tbody><tfoot><tr><td>q<sub>u</sub></td><td class="angka">' + f(r.qu) + '</td><td class="angka">100%</td><td></td></tr></tfoot></table></div>';
    h += '<p style="margin-top:14px">Kapasitas dukung izin ' + f(r.qall) + ' kPa (FS = ' + f(m.FS, 1) + '). Kontribusi terbesar berasal dari suku ' + dominan[0] +
      ' sebesar ' + f(dominan[1] / r.qu * 100, 1) + '%. ' +
      (dominan === suku[1] ? 'Artinya kedalaman pondasi paling menentukan; mengurangi D<sub>f</sub> akan menurunkan kapasitas dukung secara nyata.' :
        dominan === suku[2] ? 'Artinya lebar pondasi dan berat volume tanah di bawah dasar paling menentukan; kenaikan muka air tanah akan paling berpengaruh di sini.' :
          'Artinya kekuatan kohesi paling menentukan; nilai c\' perlu dipastikan dari uji laboratorium yang sesuai.') + '</p>';

    // 5. Catatan
    h += '<h2>5. Catatan</h2><ul>' +
      '<li>Keruntuhan dianggap geser umum. Untuk pasir lepas atau lempung lunak, keruntuhan geser lokal atau pons bisa terjadi dan kapasitasnya lebih kecil.</li>' +
      '<li>Beban vertikal dan sentris; faktor kemiringan beban dan eksentrisitas tidak dihitung.</li>' +
      '<li>Tanah dianggap homogen di zona pengaruh (sekitar B di bawah dasar pondasi).</li>' +
      r.peringatan.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>';

    el.innerHTML = h;
  }

  function perbarui() {
    var m = masukan();
    var r = PondasiDangkal.hitung(m);
    gambarSketsa(m, r);
    gambarHasil(m, r);
    U.simpanKeHash(keadaan);
  }

  function mulai() {
    keadaan = U.bacaHash(function (o) { return typeof o.bentuk === 'string' && U.tanpaHTML(o); }) || salin(CONTOH);
    isiFormulir();
    ANGKA.forEach(function (k) {
      $(k).addEventListener('input', function () { keadaan[k] = parseFloat($(k).value); perbarui(); });
    });
    $('bentuk').addEventListener('change', function () { keadaan.bentuk = $('bentuk').value; aturAktif(); perbarui(); });
    $('adaMAT').addEventListener('change', function () { keadaan.adaMAT = $('adaMAT').checked; aturAktif(); perbarui(); });
    $('muatContoh').addEventListener('click', function () { keadaan = salin(CONTOH); isiFormulir(); perbarui(); });
    $('bagikan').addEventListener('click', function () { U.simpanKeHash(keadaan); U.salinTautan($('pesanBagikan')); });
    perbarui();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
})();
