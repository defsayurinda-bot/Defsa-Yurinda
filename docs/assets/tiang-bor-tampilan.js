/* Tampilan kalkulator tiang bor: formulir, profil tanah, dan langkah hitungan. */
(function () {
  'use strict';

  var CONTOH = {
    d: 0.6, L: 12, SF: 2.5, gammaBeton: 24, pakaiBerat: true,
    lapisan: [
      { bawah: 3, jenis: 'lempung', N: 4, cu: 25 },
      { bawah: 7, jenis: 'lempung', N: 8, cu: 50 },
      { bawah: 11, jenis: 'pasir', N: 20, cu: null },
      { bawah: 16, jenis: 'pasir', N: 40, cu: null },
      { bawah: 20, jenis: 'pasir', N: 55, cu: null }
    ]
  };
  var U = window.Umum;
  var $ = U.$, f = U.f, t = U.t, rumus = U.rumus, salin = U.salin, esc = U.esc, KN_PER_TON = U.KN_PER_TON;
  var keadaan = salin(CONTOH);
  var CATATAN_MEYERHOF = '<strong>Hasil Meyerhof (1976) disembunyikan sementara.</strong> Rumus tahanan ujung yang dipakai sebelumnya adalah rumus untuk tiang pancang, ' +
    'dan pembagi tahanan selimut menurut perpindahan tiang belum bersumber. Metode ini ditampilkan lagi setelah rumusnya dicocokkan dengan pedoman PUPR (2019).';

  // ---------- Formulir ----------
  function isiFormulir() {
    ['d', 'L', 'SF', 'gammaBeton'].forEach(function (k) { $(k).value = keadaan[k]; });
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

  // Nilai dari tautan berbagi bisa berupa teks apa saja; paksa menjadi angka atau pilihan yang sah.
  function angka(v) { return v === null || v === undefined || v === '' ? null : Number(v); }
  function rapikan(k) {
    ['d', 'L', 'SF', 'gammaBeton'].forEach(function (x) { k[x] = angka(k[x]); });
    k.pakaiBerat = !!k.pakaiBerat;
    delete k.perpindahan; // opsi tiang pancang dihapus (temuan B3)
    k.lapisan = k.lapisan.map(function (ly) {
      return { bawah: angka(ly.bawah), jenis: ly.jenis === 'lempung' ? 'lempung' : 'pasir', N: angka(ly.N), cu: angka(ly.cu) };
    });
    return k;
  }

  function masukanHitung() {
    var atas = 0;
    return {
      d: keadaan.d, L: keadaan.L, SF: keadaan.SF, gammaBeton: keadaan.gammaBeton,
      pakaiBerat: keadaan.pakaiBerat,
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
  function tabelSelimut(segmen) {
    var baris = segmen.map(function (s) {
      var dasar = s.jenis === 'lempung' ? 'c<sub>u</sub> = ' + f(s.cu, 0) + ' kPa' : 'N = ' + f(s.N, 0);
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
      el.innerHTML = '<h2>Hasil</h2>' + r.galat.map(function (g) { return '<div class="catatan galat">' + esc(g) + '</div>'; }).join('');
      return;
    }
    var rw = r.reeseWright, g = r.geo;
    var lyU = m.lapisan[rw.lapisanUjung];
    var h = '';

    // Ringkasan
    h += '<h2>Ringkasan</h2><div class="ringkasan">' +
      '<div class="kartu"><div class="redup kecil" style="font-weight:700">Reese &amp; Wright (1977)</div>' +
      '<div class="nilai-besar">' + f(rw.Qa, 0) + ' <small>kN</small></div>' +
      '<div class="redup kecil">Q<sub>a</sub> ≈ ' + f(rw.Qa / KN_PER_TON, 1) + ' ton · Q<sub>u</sub> = ' + f(rw.Qu, 0) + ' kN</div></div></div>';
    h += '<div class="catatan">' + CATATAN_MEYERHOF + '</div>';
    rw.peringatan.forEach(function (p) { h += '<div class="catatan">' + esc(p) + '</div>'; });

    // Asumsi (temuan B4)
    h += '<h3>Asumsi kalkulator</h3><ul>' +
      '<li>Nilai N dipakai apa adanya, tanpa koreksi energi atau tegangan. Apakah rumus Reese &amp; Wright memakai N lapangan atau N<sub>60</sub> belum diperiksa dari sumber aslinya [BELUM TERVERIFIKASI].</li>' +
      '<li>Pada rumus selimut pasir, N di atas 53 dipotong menjadi 53. Batas ini belum diperiksa dari sumber aslinya [BELUM TERVERIFIKASI].</li>' +
      '<li>Tahanan ujung pasir dibatasi 400 t/m²; α = 0,55 untuk lempung.</li>' +
      '</ul>';

    // 1. Diketahui
    h += '<h2>1. Diketahui</h2><div class="tabel-gulir"><table><thead><tr><th>Simbol</th><th>Besaran</th><th class="angka">Nilai</th><th>Satuan</th></tr></thead><tbody>' +
      '<tr><td><i>d</i></td><td>Diameter tiang</td><td class="angka">' + f(m.d) + '</td><td>m</td></tr>' +
      '<tr><td><i>L</i></td><td>Panjang tiang tertanam</td><td class="angka">' + f(m.L) + '</td><td>m</td></tr>' +
      '<tr><td><i>SF</i></td><td>Faktor keamanan</td><td class="angka">' + f(m.SF, 1) + '</td><td>–</td></tr>' +
      (m.pakaiBerat ? '<tr><td>γ<sub>c</sub></td><td>Berat volume beton</td><td class="angka">' + f(m.gammaBeton, 1) + '</td><td>kN/m³</td></tr>' : '') +
      '</tbody></table></div>';
    h += '<p class="kecil redup" style="margin-top:10px">Data lapisan tanah sesuai tabel di atas; ujung tiang berada di lapisan ' + (rw.lapisanUjung + 1) + ' (' + (lyU.jenis === 'lempung' ? 'lempung' : 'pasir') + ').</p>';

    // 2. Ditanya
    h += '<h2>2. Ditanya</h2><p>Daya dukung ultimit Q<sub>u</sub> dan izin Q<sub>a</sub> dengan metode Reese &amp; Wright (1977).</p>';

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
    h += '<div class="langkah"><h4>c. Tahanan ujung</h4>';
    if (rw.ujung.rumus === 'kohesif') {
      h += '<p>Ujung tiang di tanah kohesif, c<sub>u</sub> = ' + f(rw.ujung.cu, 0) + ' kPa.</p>' +
        rumus('q_p = 9\\,c_u = 9 \\times ' + t(rw.ujung.cu, 0) + ' = ' + t(rw.qp) + '\\ \\text{kPa}');
    } else {
      h += '<p>Ujung tiang di tanah nonkohesif, N = ' + f(rw.ujung.N, 0) + '. Batas atas q<sub>p</sub> = 400 t/m².</p>' +
        rumus('q_p = 7N = 7 \\times ' + t(rw.ujung.N, 0) + ' = ' + t(7 * rw.ujung.N, 0) + '\\ \\text{t/m}^2' +
          (rw.ujung.dibatasi ? ' > 400 \;\\Rightarrow\; q_p = 400\\ \\text{t/m}^2' : ' \\le 400\\ \\text{t/m}^2')) +
        rumus('q_p = ' + t(rw.ujung.qpT, 0) + ' \\times 9{,}80665 = ' + t(rw.qp) + '\\ \\text{kPa}');
    }
    h += rumus('Q_p = q_p \\, A_p = ' + t(rw.qp) + ' \\times ' + t(g.Ap, 4) + ' = ' + t(rw.Qp) + '\\ \\text{kN}') + '</div>';
    h += '<div class="langkah"><h4>d. Tahanan selimut</h4>' +
      rumus('f_s = 0{,}32\\,N\\ \\text{(t/m}^2\\text{)}\\ \\text{(pasir, } N < 53) \\qquad f_s = \\alpha\\,c_u,\\ \\alpha = 0{,}55\\ \\text{(lempung)}') +
      rumus('Q_s = \\sum f_{s,i}\\, p\\, \\Delta z_i') +
      '<p class="ket">f<sub>s</sub> pasir dikonversi ke kPa dengan faktor 9,80665. Δz = tebal lapisan sepanjang tiang.</p>' +
      tabelSelimut(rw.segmen) + '</div>';
    h += '<div class="langkah"><h4>e. Daya dukung ultimit dan izin</h4>' + blokQuQa(m, rw) + '</div>';

    // 4. Hasil dan penjelasan
    h += '<h2>4. Hasil dan penjelasan</h2><div class="tabel-gulir"><table><thead><tr><th>Komponen</th><th class="angka">Reese &amp; Wright</th></tr></thead><tbody>' +
      '<tr><td>Q<sub>p</sub> (kN)</td><td class="angka">' + f(rw.Qp) + '</td></tr>' +
      '<tr><td>Q<sub>s</sub> (kN)</td><td class="angka">' + f(rw.Qs) + '</td></tr>' +
      '<tr><td>W (kN)</td><td class="angka">' + f(rw.W) + '</td></tr>' +
      '<tr><td>Q<sub>u</sub> (kN)</td><td class="angka">' + f(rw.Qu) + '</td></tr>' +
      '<tr><td><strong>Q<sub>a</sub> (kN)</strong></td><td class="angka"><strong>' + f(rw.Qa) + '</strong></td></tr>' +
      '<tr><td>Q<sub>a</sub> (ton)</td><td class="angka">' + f(rw.Qa / KN_PER_TON) + '</td></tr>' +
      '</tbody></table></div>';
    h += '<p style="margin-top:14px">Tahanan ujung menyumbang ' + f(rw.Qp / (rw.Qp + rw.Qs) * 100, 1) + '% dan tahanan selimut ' +
      f(rw.Qs / (rw.Qp + rw.Qs) * 100, 1) + '% dari Q<sub>p</sub> + Q<sub>s</sub>.</p>';

    // 5. Catatan
    h += '<h2>5. Catatan</h2><ul>' +
      '<li>Kepala tiang dianggap di muka tanah.</li>' +
      '<li>Tidak memperhitungkan efek kelompok tiang, gesek negatif, maupun penurunan.</li>' +
      '<li>Reese &amp; Wright memakai N di lapisan tempat ujung tiang, sehingga hasil bisa berubah tajam bila ujung tiang dekat batas lapisan.</li>' +
      rw.peringatan.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') +
      '</ul>';

    el.innerHTML = h;
  }

  function simpanKeHash() { U.simpanKeHash(keadaan); }

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
    $('bagikan').addEventListener('click', function () { simpanKeHash(); U.salinTautan($('pesanBagikan')); });
  }

  function mulai() {
    var dariTautan = U.bacaHash(function (o) { return Array.isArray(o.lapisan) && U.tanpaHTML(o); });
    keadaan = dariTautan ? rapikan(dariTautan) : salin(CONTOH);
    isiFormulir();
    pasangPendengar();
    perbarui();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
  // KaTeX dimuat terpisah; gambar ulang rumus setelah siap.
  window.addEventListener('load', function () { if (window.katex) perbarui(); });
})();
