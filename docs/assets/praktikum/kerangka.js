/*
 * Kerangka alat praktikum: membangun formulir, menyimpan data, menghitung, dan menampilkan hasil
 * dari satu definisi alat. Alat baru cukup memanggil Praktikum.pasang({...}); lihat alat-*.js.
 *
 * Definisi alat:
 *   id, parameter: [{ id, label, satuan, pilihan: [[nilai, label]], bantuan }],
 *   tabel: [{ id, judul, kolom: 'Cawan', awal, min, maks, baris: [{ id, label, simbol, satuan, opsional }] }]
 *          atau tabel baris: [{ id, judul, jenis: 'baris', pilihanBaris: [nama…], kolomNilai: { id, label } }]
 *   contoh: { param: {…}, tabel: { id: [ {nama, …nilai} ] } },   kosong: { param: {…} }
 *   hitung(masukan) → { galat: [], peringatan: [], … }
 *   tampil(masukan, hasil, U) → HTML hasil
 *   ekspor(masukan, hasil) → [[sel, …], …] untuk CSV / salin ke Excel
 *   sumber: [HTML, …]
 */
(function (root) {
  'use strict';

  var U0 = root.Umum;
  var KUNCI_IDENTITAS = 'praktikum-identitas';
  var IDENTITAS = [['proyek', 'Proyek'], ['lokasi', 'Lokasi'], ['sampel', 'No. sampel'], ['kedalaman', 'Kedalaman'],
    ['tanggal', 'Tanggal'], ['dikerjakan', 'Dikerjakan'], ['diperiksa', 'Diperiksa']];

  function simpan(kunci, nilai) { try { localStorage.setItem(kunci, JSON.stringify(nilai)); } catch (e) { /* tidak tersedia */ } }
  function baca(kunci) { try { return JSON.parse(localStorage.getItem(kunci)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Terima "45,31", "45.31", "1.234,5".
  function angka(s) {
    if (s === null || s === undefined) return NaN;
    s = String(s).trim().replace(/\s/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    return Number(s);
  }
  function teksAngka(v) { return v === null || v === undefined || v === '' ? '' : String(v).replace('.', ','); }

  // ---------------------------------------------------------------- bantuan tampilan untuk definisi alat
  var bantu = {
    f: U0.f, t: U0.t, rumus: U0.rumus, tex: U0.tex,
    kartu: function (label, nilai, ket) {
      return '<div class="kartu"><div class="redup kecil" style="font-weight:700">' + label + '</div><div class="nilai-besar">' + nilai + '</div>' +
        (ket ? '<div class="redup kecil">' + ket + '</div>' : '') + '</div>';
    },
    ringkasan: function (kartu) { return '<div class="ringkasan">' + kartu.join('') + '</div>'; },
    tabel: function (kepala, baris, kaki) {
      return '<div class="tabel-gulir"><table><thead><tr>' + kepala.map(function (k, i) { return '<th' + (i >= 3 || k.angka ? ' class="angka"' : '') + '>' + (k.teks || k) + '</th>'; }).join('') +
        '</tr></thead><tbody>' + baris.map(function (b) {
          return '<tr>' + b.map(function (c, i) { return '<td' + (i >= 3 ? ' class="angka"' : '') + '>' + (c === null || c === undefined ? '–' : c) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody>' + (kaki ? '<tfoot><tr>' + kaki.map(function (c, i) { return '<td' + (i >= 3 ? ' class="angka"' : '') + '>' + c + '</td>'; }).join('') + '</tr></tfoot>' : '') +
        '</table></div>';
    },
    langkah: function (judul, isi) { return '<div class="langkah"><h4>' + judul + '</h4>' + isi + '</div>'; },
    grafik: function (svg, ket) { return '<figure class="kartu grafik-bingkai">' + svg + (ket ? '<figcaption class="kecil redup">' + ket + '</figcaption>' : '') + '</figure>'; }
  };

  // ---------------------------------------------------------------- pemasangan alat
  function pasang(def) {
    var akar = document.getElementById('alat-praktikum');
    var KUNCI = 'praktikum-' + def.id;
    var keadaan = muatAwal();
    var identitas = baca(KUNCI_IDENTITAS) || {};

    function salin(o) { return JSON.parse(JSON.stringify(o)); }
    function kosong() {
      var k = { param: salin((def.kosong && def.kosong.param) || {}), tabel: {} };
      def.tabel.forEach(function (tb) {
        if (tb.jenis === 'baris') k.tabel[tb.id] = (tb.barisAwal || []).map(function (n) { return { nama: n }; });
        else {
          k.tabel[tb.id] = [];
          for (var i = 0; i < (tb.awal || 3); i++) k.tabel[tb.id].push({ nama: String(i + 1) });
        }
      });
      return k;
    }
    function muatAwal() {
      var dariTautan = U0.bacaHash(function (o) { return o && o.param && o.tabel; });
      return dariTautan || baca(KUNCI) || salin(def.contoh);
    }

    // Kumpulkan masukan lengkap untuk fungsi hitung; kolom setengah terisi dilaporkan.
    function masukan() {
      var m = { param: {}, tabel: {}, tidakLengkap: [] };
      (def.parameter || []).forEach(function (p) {
        var v = keadaan.param[p.id];
        m.param[p.id] = p.pilihan ? v : angka(v);
      });
      def.tabel.forEach(function (tb) {
        if (tb.jenis === 'baris') {
          m.tabel[tb.id] = keadaan.tabel[tb.id].map(function (b) { return { nama: b.nama, nilai: angka(b.nilai) }; });
          return;
        }
        m.tabel[tb.id] = [];
        keadaan.tabel[tb.id].forEach(function (k, i) {
          var wajib = tb.baris.filter(function (b) { return !b.opsional; });
          var terisi = wajib.filter(function (b) { return isFinite(angka(k[b.id])); }).length;
          if (terisi === 0) return;
          if (terisi < wajib.length) { m.tidakLengkap.push(tb.kolom + ' ' + (k.nama || i + 1)); return; }
          var o = { nama: k.nama || String(i + 1) };
          tb.baris.forEach(function (b) { var v = angka(k[b.id]); o[b.id] = isFinite(v) ? v : null; });
          m.tabel[tb.id].push(o);
        });
      });
      return m;
    }

    // ---------------- formulir
    function htmlParameter() {
      if (!def.parameter || !def.parameter.length) return '';
      return '<div class="isian-kisi">' + def.parameter.map(function (p) {
        var v = keadaan.param[p.id];
        var isian = p.pilihan
          ? '<select id="p-' + p.id + '" data-param="' + p.id + '">' + p.pilihan.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'
          : '<input id="p-' + p.id + '" data-param="' + p.id + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(teksAngka(v)) + '">';
        return '<div><label for="p-' + p.id + '">' + p.label + (p.satuan ? ' (' + p.satuan + ')' : '') + '</label>' + isian +
          (p.bantuan ? '<div class="kecil redup" style="margin-top:4px">' + p.bantuan + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    }

    function htmlTabel(tb) {
      var data = keadaan.tabel[tb.id];
      if (tb.jenis === 'baris') {
        var tersedia = tb.pilihanBaris.filter(function (n) { return !data.some(function (b) { return b.nama === n; }); });
        return '<h3>' + tb.judul + '</h3>' + (tb.keterangan ? '<p class="kecil redup">' + tb.keterangan + '</p>' : '') +
          '<div class="tabel-gulir"><table class="tabel-isian"><thead><tr><th>' + tb.namaBaris + '</th><th class="angka">' + tb.kolomNilai.label + '</th><th></th></tr></thead><tbody>' +
          data.map(function (b, i) {
            return '<tr><td>' + esc(b.nama) + (tb.infoBaris ? ' <span class="kecil redup">' + tb.infoBaris(b.nama) + '</span>' : '') + '</td>' +
              '<td><input type="text" inputmode="decimal" autocomplete="off" data-tabel="' + tb.id + '" data-i="' + i + '" data-k="nilai" value="' + esc(teksAngka(b.nilai)) + '" aria-label="' + esc(tb.kolomNilai.label + ' ' + b.nama) + '"></td>' +
              '<td><button type="button" class="tombol kecil" data-hapus-baris="' + tb.id + '" data-i="' + i + '" aria-label="Hapus ' + esc(b.nama) + '">×</button></td></tr>';
          }).join('') + '</tbody></table></div>' +
          (tersedia.length ? '<div class="baris-tombol tidak-cetak"><select data-tambah-pilihan="' + tb.id + '" aria-label="Pilih ' + tb.namaBaris.toLowerCase() + '">' +
            tersedia.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select><button type="button" class="tombol kecil" data-tambah-baris="' + tb.id + '">+ Tambah ' + tb.namaBaris.toLowerCase() + '</button></div>' : '');
      }
      var kepala = '<tr><th>Uraian</th><th>Simbol</th><th>Satuan</th>' + data.map(function (k, i) {
        return '<th class="angka"><input class="nama-kolom" type="text" data-tabel="' + tb.id + '" data-i="' + i + '" data-k="nama" value="' + esc(k.nama) + '" aria-label="Nama ' + tb.kolom + ' ' + (i + 1) + '"></th>';
      }).join('') + '</tr>';
      var badan = tb.baris.map(function (b) {
        return '<tr><td>' + b.label + (b.opsional ? ' <span class="kecil redup">(opsional)</span>' : '') + '</td><td>' + (b.simbol || '') + '</td><td>' + (b.satuan || '') + '</td>' +
          data.map(function (k, i) {
            return '<td><input type="text" inputmode="decimal" autocomplete="off" data-tabel="' + tb.id + '" data-i="' + i + '" data-k="' + b.id + '" value="' + esc(teksAngka(k[b.id])) + '" aria-label="' + esc(b.label.replace(/<[^>]+>/g, '') + ', ' + tb.kolom + ' ' + (k.nama || i + 1)) + '"></td>';
          }).join('') + '</tr>';
      }).join('');
      return '<h3>' + tb.judul + '</h3>' + (tb.keterangan ? '<p class="kecil redup">' + tb.keterangan + '</p>' : '') +
        '<div class="tabel-gulir"><table class="tabel-isian"><thead>' + kepala + '</thead><tbody>' + badan + '</tbody></table></div>' +
        '<div class="baris-tombol tidak-cetak">' +
        (data.length < (tb.maks || 10) ? '<button type="button" class="tombol kecil" data-tambah-kolom="' + tb.id + '">+ ' + tb.kolom + '</button>' : '') +
        (data.length > (tb.min || 1) ? '<button type="button" class="tombol kecil" data-kurang-kolom="' + tb.id + '">− ' + tb.kolom + '</button>' : '') + '</div>';
    }

    function htmlIdentitas() {
      return '<details class="identitas tidak-cetak"><summary>Identitas contoh (untuk kop cetak)</summary><div class="isian-kisi" style="margin-top:12px">' +
        IDENTITAS.map(function (p) {
          return '<div><label for="id-' + p[0] + '">' + p[1] + '</label><input id="id-' + p[0] + '" data-identitas="' + p[0] + '" type="text" autocomplete="off" value="' + esc(identitas[p[0]] || '') + '"></div>';
        }).join('') + '</div><p class="kecil redup">Identitas hanya disimpan di browser ini dan tidak ikut dalam tautan berbagi.</p></details>';
    }

    function gambarFormulir() {
      var el = document.getElementById('formulir-praktikum');
      el.innerHTML = htmlIdentitas() + htmlParameter() + def.tabel.map(htmlTabel).join('') +
        '<div class="baris-tombol tidak-cetak" style="margin-top:22px">' +
        '<button type="button" class="tombol kecil" data-aksi="contoh">Muat data contoh</button>' +
        '<button type="button" class="tombol kecil" data-aksi="kosong">Kosongkan</button>' +
        '<button type="button" class="tombol kecil" data-aksi="salin-excel">Salin ke Excel</button>' +
        '<button type="button" class="tombol kecil" data-aksi="csv">Unduh CSV</button>' +
        '<button type="button" class="tombol kecil" data-aksi="tautan">Salin tautan</button>' +
        '<button type="button" class="tombol kecil" data-aksi="cetak">Cetak / PDF</button></div>' +
        '<p class="kecil redup" id="pesan-praktikum" role="status" aria-live="polite"></p>';
    }

    // ---------------- hasil
    function gambarHasil() {
      var m = masukan(), el = document.getElementById('hasil-praktikum'), h = '';
      m.tidakLengkap.forEach(function (n) { h += '<div class="catatan">' + n + ' belum lengkap, jadi belum ikut dihitung.</div>'; });
      var kosong = !m.tidakLengkap.length && def.tabel.every(function (tb) {
        return tb.jenis === 'baris' ? !m.tabel[tb.id].some(function (b) { return isFinite(b.nilai); }) : !m.tabel[tb.id].length;
      });
      if (kosong) {
        el.innerHTML = '<h2>Hasil</h2><div class="kartu redup">Isi data di formulir, atau klik <strong>Muat data contoh</strong> untuk melihat contoh hasilnya.</div>';
        return;
      }
      var r = def.hitung(m);
      if (r.galat && r.galat.length) {
        el.innerHTML = '<h2>Hasil</h2>' + h + r.galat.map(function (g) { return '<div class="catatan galat">' + g + '</div>'; }).join('');
        return;
      }
      (r.peringatan || []).forEach(function (p) { h += '<div class="catatan">' + p + '</div>'; });
      el.innerHTML = '<h2>Hasil</h2>' + h + def.tampil(m, r, bantu);
      document.getElementById('kop-cetak').innerHTML = kop();
      return { m: m, r: r };
    }

    function kop() {
      var isi = IDENTITAS.filter(function (p) { return identitas[p[0]]; });
      if (!isi.length) return '';
      return '<table class="kop"><tbody>' + isi.map(function (p) { return '<tr><td>' + p[1] + '</td><td>: ' + esc(identitas[p[0]]) + '</td></tr>'; }).join('') + '</tbody></table>';
    }

    function perbarui(gambarUlangFormulir) {
      if (gambarUlangFormulir) gambarFormulir();
      simpan(KUNCI, keadaan);
      U0.simpanKeHash(keadaan);
      gambarHasil();
    }

    // ---------------- ekspor
    function tabelEkspor() {
      var m = masukan(), r = def.hitung(m);
      var baris = [[def.judulEkspor || document.title.split(' · ')[0]]];
      IDENTITAS.forEach(function (p) { if (identitas[p[0]]) baris.push([p[1], identitas[p[0]]]); });
      baris.push([]);
      if (r.galat && r.galat.length) return baris.concat(r.galat.map(function (g) { return ['Galat', g]; }));
      return baris.concat(def.ekspor(m, r));
    }
    function sel(v, pemisah) {
      if (typeof v === 'number') return isFinite(v) ? String(Math.round(v * 1e6) / 1e6).replace('.', ',') : '';
      v = v == null ? '' : String(v).replace(/<[^>]+>/g, '');
      return (v.indexOf(pemisah) >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }
    function pesan(t) { document.getElementById('pesan-praktikum').textContent = t; }

    function aksi(nama) {
      if (nama === 'contoh') { keadaan = salin(def.contoh); perbarui(true); pesan('Data contoh dimuat. Angkanya hanya contoh, bukan data pengujian sungguhan.'); }
      if (nama === 'kosong') { keadaan = kosong(); perbarui(true); pesan('Formulir dikosongkan.'); }
      if (nama === 'tautan') { U0.simpanKeHash(keadaan); U0.salinTautan(document.getElementById('pesan-praktikum')); }
      if (nama === 'cetak') window.print();
      if (nama === 'salin-excel') {
        var tsv = tabelEkspor().map(function (b) { return b.map(function (v) { return sel(v, '\t'); }).join('\t'); }).join('\n');
        if (navigator.clipboard) navigator.clipboard.writeText(tsv).then(function () { pesan('Tabel disalin. Tempel di Excel dengan Ctrl+V.'); }, function () { pesan('Browser menolak akses papan klip. Pakai tombol Unduh CSV.'); });
        else pesan('Browser tidak mendukung salin otomatis. Pakai tombol Unduh CSV.');
      }
      if (nama === 'csv') {
        var csv = '﻿' + tabelEkspor().map(function (b) { return b.map(function (v) { return sel(v, ';'); }).join(';'); }).join('\r\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = def.id + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
        pesan('Berkas ' + def.id + '.csv diunduh. Pemisah kolom titik koma dan desimal koma, sesuai Excel berbahasa Indonesia.');
      }
    }

    // ---------------- pendengar (delegasi, jadi tetap jalan setelah formulir digambar ulang)
    akar.innerHTML = '<div id="kop-cetak" class="hanya-cetak"></div><form id="formulir-praktikum" class="kartu" autocomplete="off" onsubmit="return false"></form>' +
      '<section id="hasil-praktikum" aria-live="polite"></section>' +
      (def.sumber ? '<section><h2>Acuan</h2><ul class="daftar-bersih">' + def.sumber.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
        '<div class="catatan"><strong>Alat bantu belajar.</strong> Peringatan kuning adalah pemeriksaan kewajaran otomatis, bukan ketentuan standar. Ikuti modul dan arahan asisten laboratorium untuk laporan resmi.</div></section>' : '');
    var form = document.getElementById('formulir-praktikum');
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.param) { keadaan.param[t.dataset.param] = t.tagName === 'SELECT' ? t.value : t.value; perbarui(false); }
      else if (t.dataset.tabel) { keadaan.tabel[t.dataset.tabel][+t.dataset.i][t.dataset.k] = t.value; perbarui(false); }
      else if (t.dataset.identitas) { identitas[t.dataset.identitas] = t.value; simpan(KUNCI_IDENTITAS, identitas); document.getElementById('kop-cetak').innerHTML = kop(); }
    });
    form.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT' && e.target.dataset.param) { keadaan.param[e.target.dataset.param] = e.target.value; perbarui(false); } });
    form.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      var d = t.dataset;
      if (d.aksi) return aksi(d.aksi);
      if (d.tambahKolom) { var tb = keadaan.tabel[d.tambahKolom]; tb.push({ nama: String(tb.length + 1) }); perbarui(true); }
      if (d.kurangKolom) { keadaan.tabel[d.kurangKolom].pop(); perbarui(true); }
      if (d.hapusBaris) { keadaan.tabel[d.hapusBaris].splice(+d.i, 1); perbarui(true); }
      if (d.tambahBaris) {
        var pilih = form.querySelector('[data-tambah-pilihan="' + d.tambahBaris + '"]').value;
        var def2 = def.tabel.filter(function (x) { return x.id === d.tambahBaris; })[0];
        var daftar = keadaan.tabel[d.tambahBaris];
        daftar.push({ nama: pilih });
        daftar.sort(function (a, b) { return def2.pilihanBaris.indexOf(a.nama) - def2.pilihanBaris.indexOf(b.nama); });
        perbarui(true);
      }
    });
    // Enter pindah ke isian di bawahnya, seperti mengisi lembar data per kolom.
    form.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
      e.preventDefault();
      var semua = Array.prototype.slice.call(form.querySelectorAll('input[data-tabel][data-k]:not(.nama-kolom)'));
      var t = e.target, cocok = semua.filter(function (x) { return x.dataset.tabel === t.dataset.tabel && x.dataset.i === t.dataset.i; });
      var i = cocok.indexOf(t);
      if (i >= 0 && i < cocok.length - 1) cocok[i + 1].focus();
    });

    gambarFormulir();
    perbarui(false);
  }

  root.Praktikum = { pasang: pasang, angka: angka };
})(this);
