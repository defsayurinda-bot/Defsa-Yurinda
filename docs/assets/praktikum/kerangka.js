/*
 * Kerangka alat praktikum: membangun formulir, menyimpan data, menghitung, dan menampilkan hasil
 * dari satu definisi alat. Alat baru cukup memanggil Praktikum.pasang({...}); lihat alat-*.js.
 *
 * Definisi alat:
 *   id, judulEkspor,
 *   parameter: [{ id, label, satuan, pilihan: [[nilai, label]], bantuan, tampilJika: fn(param) → bool,
 *                 dariAlat: { alat, nama, ambil: fn(hasil) → angka, d } }]
 *   impor: [{ alat, nama, isi: fn(hasil) → { idParameter: nilai } }]      tombol "ambil dari alat lain"
 *   tabel: tiga jenis
 *     kolom (bawaan): kolom = benda uji/cawan, baris = besaran
 *       { id, judul, kolom: 'Cawan', awal, min, maks, baris: [{ id, label, simbol, satuan, opsional }] }
 *     baris: satu nilai per baris yang dipilih dari daftar (mis. saringan)
 *       { id, jenis: 'baris', judul, namaBaris, pilihanBaris: [nama…], barisAwal, kolomNilai: { id, label }, infoBaris }
 *     daftar: baris bebas dengan beberapa kolom (mis. bacaan waktu, kedalaman)
 *       { id, jenis: 'daftar', judul, namaPendek, awal: n | [{…}], maks,
 *         kolom: [{ id, label, satuan, opsional, kunci, teks, pilihan }],
 *         kolomDari: { tabel, awalan, label: fn(nama, i), satuan } }        kolom tambahan mengikuti tabel lain
 *       Kolom 'kunci' (mis. waktu yang sudah terisi) tidak membuat baris dianggap terisi.
 *   contoh: { param: {…}, tabel: { id: [ {…} ] } },   kosong: { param: {…}, tabel: {…} }
 *   hitung(masukan) → { galat: [], peringatan: [], … }
 *   tampil(masukan, hasil, U) → HTML hasil
 *   ekspor(masukan, hasil) → [[sel, …], …] untuk CSV / salin ke Excel
 *   hasil(masukan, hasil) → objek yang disimpan untuk dipakai alat lain (opsional)
 *   sumber: [HTML, …]
 */
(function (root) {
  'use strict';

  var U0 = root.Umum;
  var KUNCI_IDENTITAS = 'praktikum-identitas';
  var IDENTITAS = [['proyek', 'Proyek'], ['lokasi', 'Lokasi'], ['sampel', 'No. sampel / titik'], ['kedalaman', 'Kedalaman'],
    ['tanggal', 'Tanggal'], ['dikerjakan', 'Dikerjakan'], ['diperiksa', 'Diperiksa']];

  function simpan(kunci, nilai) { try { localStorage.setItem(kunci, JSON.stringify(nilai)); } catch (e) { /* tidak tersedia */ } }
  function baca(kunci) { try { return JSON.parse(localStorage.getItem(kunci)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Terima "45,31", "45.31", "1.234,5".
  function angka(s) {
    if (s === null || s === undefined) return NaN;
    if (typeof s === 'number') return s;
    s = String(s).trim().replace(/\s/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    return Number(s);
  }
  function teksAngka(v) { return v === null || v === undefined || v === '' ? '' : String(v).replace('.', ','); }

  // Hasil antaralat: disimpan per alat di browser, dengan waktu dan tanda data contoh.
  function simpanHasil(id, nilai, contoh) { simpan('praktikum-hasil-' + id, { waktu: Date.now(), contoh: !!contoh, nilai: nilai }); }
  function bacaHasil(id) {
    var o = baca('praktikum-hasil-' + id);
    if (!o) return null;
    return o.nilai ? o : { waktu: null, contoh: false, nilai: o }; // format lama: nilai langsung
  }
  function waktuSingkat(t) {
    if (!t) return '';
    var d = new Date(t);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  // ---------------------------------------------------------------- bantuan tampilan untuk definisi alat
  var bantu = {
    f: U0.f, t: U0.t, rumus: U0.rumus, tex: U0.tex, esc: esc,
    kartu: function (label, nilai, ket) {
      return '<div class="kartu"><div class="redup kecil" style="font-weight:700">' + label + '</div><div class="nilai-besar">' + nilai + '</div>' +
        (ket ? '<div class="redup kecil">' + ket + '</div>' : '') + '</div>';
    },
    ringkasan: function (kartu) { return '<div class="ringkasan">' + kartu.join('') + '</div>'; },
    // Kolom ke-0..2 teks (uraian, simbol, satuan), sisanya angka. o.angkaMulai mengubah batas itu.
    tabel: function (kepala, baris, kaki, o) {
      o = o || {};
      var mulai = o.angkaMulai === undefined ? 3 : o.angkaMulai;
      return '<div class="tabel-gulir"><table><thead><tr>' + kepala.map(function (k, i) { return '<th' + (i >= mulai || k.angka ? ' class="angka"' : '') + '>' + (k.teks || k) + '</th>'; }).join('') +
        '</tr></thead><tbody>' + baris.map(function (b) {
          return '<tr>' + b.map(function (c, i) { return '<td' + (i >= mulai ? ' class="angka"' : '') + '>' + (c === null || c === undefined ? '–' : c) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody>' + (kaki ? '<tfoot><tr>' + kaki.map(function (c, i) { return '<td' + (i >= mulai ? ' class="angka"' : '') + '>' + c + '</td>'; }).join('') + '</tr></tfoot>' : '') +
        '</table></div>';
    },
    langkah: function (judul, isi) { return '<div class="langkah"><h4>' + judul + '</h4>' + isi + '</div>'; },
    grafik: function (svg, ket) {
      return '<figure class="kartu grafik-bingkai">' + svg + '<figcaption class="kecil redup">' + (ket || '') +
        '</figcaption><div class="tidak-cetak" style="margin-top:8px"><button type="button" class="tombol kecil" data-png>Unduh PNG</button></div></figure>';
    }
  };

  // ---------------------------------------------------------------- pemasangan alat
  function pasang(def) {
    var akar = document.getElementById('alat-praktikum');
    var KUNCI = 'praktikum-' + def.id;
    var identitas = baca(KUNCI_IDENTITAS) || {};
    var keadaan = muatAwal();

    function salin(o) { return JSON.parse(JSON.stringify(o)); }
    function tabelDef(id) { return def.tabel.filter(function (x) { return x.id === id; })[0]; }

    function barisKosongDaftar(tb) {
      if (Array.isArray(tb.awal)) return salin(tb.awal);
      var hasil = [];
      for (var i = 0; i < (tb.awal || 5); i++) hasil.push({});
      return hasil;
    }
    function kosong() {
      var k = { param: salin((def.kosong && def.kosong.param) || {}), tabel: {} };
      def.tabel.forEach(function (tb) {
        if (def.kosong && def.kosong.tabel && def.kosong.tabel[tb.id]) k.tabel[tb.id] = salin(def.kosong.tabel[tb.id]);
        else if (tb.jenis === 'baris') k.tabel[tb.id] = (tb.barisAwal || []).map(function (n) { return { nama: n }; });
        else if (tb.jenis === 'daftar') k.tabel[tb.id] = barisKosongDaftar(tb);
        else {
          k.tabel[tb.id] = [];
          for (var i = 0; i < (tb.awal || 3); i++) k.tabel[tb.id].push({ nama: String(i + 1) });
        }
      });
      return k;
    }
    function contoh() { var c = salin(def.contoh); c.contoh = true; return c; }
    // Keadaan tersimpan dilengkapi bila definisi alat bertambah tabel atau parameter.
    function lengkapi(k) {
      k.param = k.param || {};
      k.tabel = k.tabel || {};
      var dasar = kosong();
      Object.keys(dasar.param).forEach(function (p) { if (!(p in k.param)) k.param[p] = dasar.param[p]; });
      def.tabel.forEach(function (tb) { if (!Array.isArray(k.tabel[tb.id])) k.tabel[tb.id] = dasar.tabel[tb.id]; });
      return k;
    }
    function muatAwal() {
      var dariTautan = U0.bacaHash(function (o) { return o && o.param && o.tabel; });
      return lengkapi(dariTautan || baca(KUNCI) || contoh());
    }

    // Kolom tabel daftar, termasuk kolom yang mengikuti jumlah kolom tabel lain.
    function kolomDaftar(tb) {
      var k = tb.kolom.slice();
      if (tb.kolomDari) {
        (keadaan.tabel[tb.kolomDari.tabel] || []).forEach(function (s, i) {
          k.push({ id: tb.kolomDari.awalan + i, label: tb.kolomDari.label(s.nama || String(i + 1), i), satuan: tb.kolomDari.satuan, opsional: true, dinamis: i });
        });
      }
      return k;
    }
    function kolomAngka(k) { return !k.teks && !k.pilihan; }
    // Label dan satuan baris boleh berupa fungsi dari parameter (mis. berubah menurut cara uji).
    function teks(v) { return typeof v === 'function' ? v(keadaan.param) : (v || ''); }

    // Kumpulkan masukan lengkap untuk fungsi hitung; kolom atau baris setengah terisi dilaporkan.
    function masukan() {
      var m = { param: {}, tabel: {}, tidakLengkap: [], contoh: !!keadaan.contoh };
      (def.parameter || []).forEach(function (p) {
        var v = keadaan.param[p.id];
        m.param[p.id] = p.pilihan ? (v === undefined || v === null || v === '' ? p.pilihan[0][0] : v) : angka(v);
      });
      def.tabel.forEach(function (tb) {
        if (tb.jenis === 'baris') {
          m.tabel[tb.id] = keadaan.tabel[tb.id].map(function (b) { return { nama: b.nama, nilai: angka(b.nilai) }; });
          return;
        }
        m.tabel[tb.id] = [];
        if (tb.jenis === 'daftar') {
          var kol = kolomDaftar(tb);
          keadaan.tabel[tb.id].forEach(function (b, i) {
            var terisi = kol.filter(function (k) { return kolomAngka(k) && !k.kunci && isFinite(angka(b[k.id])); }).length;
            var adaTeks = kol.some(function (k) { return k.teks && String(b[k.id] || '').trim(); });
            if (!terisi && !adaTeks) return;
            var kurang = kol.filter(function (k) { return kolomAngka(k) && !k.opsional && !isFinite(angka(b[k.id])); });
            if (kurang.length) { m.tidakLengkap.push((tb.namaPendek || tb.judul) + ', baris ' + (i + 1)); return; }
            var o = { no: i + 1 };
            kol.forEach(function (k) {
              if (k.dinamis !== undefined) return;
              if (k.teks) o[k.id] = String(b[k.id] || '').trim();
              else if (k.pilihan) o[k.id] = b[k.id] || k.pilihan[0][0];
              else { var v = angka(b[k.id]); o[k.id] = isFinite(v) ? v : null; }
            });
            if (tb.kolomDari) {
              o.nilai = kol.filter(function (k) { return k.dinamis !== undefined; }).map(function (k) { var v = angka(b[k.id]); return isFinite(v) ? v : null; });
            }
            m.tabel[tb.id].push(o);
          });
          return;
        }
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
    function htmlImpor() {
      if (!def.impor || !def.impor.length) return '';
      return '<div class="impor tidak-cetak"><span class="kecil redup">Ambil hasil alat lain yang tersimpan di browser ini:</span><div class="baris-tombol" style="margin:8px 0 0">' +
        def.impor.map(function (im, i) {
          var h = bacaHasil(im.alat);
          if (!h) return '<a class="tombol kecil" href="../' + im.alat + '/" title="Belum ada hasil tersimpan. Buka alatnya dulu.">' + im.nama + ' (belum ada) →</a>';
          return '<button type="button" class="tombol kecil" data-impor="' + i + '">Ambil dari ' + im.nama +
            ' <span class="redup kecil">' + (h.contoh ? 'data contoh' : waktuSingkat(h.waktu)) + '</span></button>';
        }).join('') + '</div></div>';
    }

    function htmlParameter() {
      var tampil = (def.parameter || []).filter(function (p) { return !p.tampilJika || p.tampilJika(keadaan.param); });
      if (!tampil.length) return '';
      return '<div class="isian-kisi">' + tampil.map(function (p) {
        var v = keadaan.param[p.id];
        var isian = p.pilihan
          ? '<select id="p-' + p.id + '" data-param="' + p.id + '">' + p.pilihan.map(function (o) { return '<option value="' + o[0] + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'
          : '<input id="p-' + p.id + '" data-param="' + p.id + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(teksAngka(v)) + '">';
        var ambil = '';
        if (p.dariAlat) {
          var h = bacaHasil(p.dariAlat.alat), nilai = h ? p.dariAlat.ambil(h.nilai) : null;
          if (nilai !== null && nilai !== undefined && isFinite(nilai)) {
            ambil = '<button type="button" class="tautan-kecil tidak-cetak" data-ambil="' + p.id + '">Pakai hasil ' + p.dariAlat.nama + ': ' +
              U0.f(nilai, p.dariAlat.d === undefined ? 3 : p.dariAlat.d) + (h.contoh ? ' (data contoh)' : '') + '</button>';
          }
        }
        return '<div><label for="p-' + p.id + '">' + p.label + (p.satuan ? ' (' + p.satuan + ')' : '') + '</label>' + isian + ambil +
          (p.bantuan ? '<div class="kecil redup" style="margin-top:4px">' + p.bantuan + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    }

    function htmlTabel(tb) {
      var data = keadaan.tabel[tb.id];
      var kepalaTabel = '<h3>' + tb.judul + '</h3>' + (tb.keterangan ? '<p class="kecil redup">' + tb.keterangan + '</p>' : '');
      if (tb.jenis === 'baris') {
        var tersedia = tb.pilihanBaris.filter(function (n) { return !data.some(function (b) { return b.nama === n; }); });
        return kepalaTabel +
          '<div class="tabel-gulir"><table class="tabel-isian"><thead><tr><th>' + tb.namaBaris + '</th><th class="angka">' + tb.kolomNilai.label + '</th><th></th></tr></thead><tbody>' +
          data.map(function (b, i) {
            return '<tr><td>' + esc(b.nama) + (tb.infoBaris ? ' <span class="kecil redup">' + tb.infoBaris(b.nama) + '</span>' : '') + '</td>' +
              '<td><input type="text" inputmode="decimal" autocomplete="off" data-tabel="' + tb.id + '" data-i="' + i + '" data-k="nilai" value="' + esc(teksAngka(b.nilai)) + '" aria-label="' + esc(tb.kolomNilai.label + ' ' + b.nama) + '"></td>' +
              '<td><button type="button" class="tombol kecil" data-hapus-baris="' + tb.id + '" data-i="' + i + '" aria-label="Hapus ' + esc(b.nama) + '">×</button></td></tr>';
          }).join('') + '</tbody></table></div>' +
          (tersedia.length ? '<div class="baris-tombol tidak-cetak"><select data-tambah-pilihan="' + tb.id + '" aria-label="Pilih ' + tb.namaBaris.toLowerCase() + '">' +
            tersedia.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select><button type="button" class="tombol kecil" data-tambah-baris="' + tb.id + '">+ Tambah ' + tb.namaBaris.toLowerCase() + '</button></div>' : '');
      }
      if (tb.jenis === 'daftar') {
        var kol = kolomDaftar(tb);
        return kepalaTabel +
          '<div class="tabel-gulir"><table class="tabel-isian tabel-daftar"><thead><tr><th>No.</th>' + kol.map(function (k) {
            return '<th class="' + (kolomAngka(k) ? 'angka' : '') + '">' + k.label + (k.satuan ? '<br><span class="kecil redup" style="font-weight:600">(' + k.satuan + ')</span>' : '') +
              (k.opsional && !k.teks && k.dinamis === undefined ? '<br><span class="kecil redup" style="font-weight:600">opsional</span>' : '') + '</th>';
          }).join('') + '<th></th></tr></thead><tbody>' +
          data.map(function (b, i) {
            return '<tr><td>' + (i + 1) + '</td>' + kol.map(function (k) {
              var atr = ' data-tabel="' + tb.id + '" data-i="' + i + '" data-k="' + k.id + '" aria-label="' + esc(String(k.label).replace(/<[^>]+>/g, '') + ', baris ' + (i + 1)) + '"';
              if (k.pilihan) {
                return '<td><select' + atr + '>' + k.pilihan.map(function (o) { return '<option value="' + o[0] + '"' + (String(b[k.id]) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td>';
              }
              return '<td><input type="text"' + (k.teks ? ' class="teks"' : ' inputmode="decimal"') + ' autocomplete="off"' + atr + ' value="' + esc(k.teks ? (b[k.id] || '') : teksAngka(b[k.id])) + '"></td>';
            }).join('') +
              '<td><button type="button" class="tombol kecil" data-hapus-baris="' + tb.id + '" data-i="' + i + '" aria-label="Hapus baris ' + (i + 1) + '">×</button></td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="baris-tombol tidak-cetak">' +
          (data.length < (tb.maks || 60) ? '<button type="button" class="tombol kecil" data-tambah-daftar="' + tb.id + '" data-n="1">+ Baris</button>' +
            '<button type="button" class="tombol kecil" data-tambah-daftar="' + tb.id + '" data-n="5">+ 5 baris</button>' : '') +
          '<span class="kecil redup" style="align-self:center">Bisa tempel dari Excel: blok sel, salin, lalu tempel di sel pertama.</span></div>';
      }
      var kepala = '<tr><th>Uraian</th><th>Simbol</th><th>Satuan</th>' + data.map(function (k, i) {
        return '<th class="angka"><input class="nama-kolom" type="text" data-tabel="' + tb.id + '" data-i="' + i + '" data-k="nama" value="' + esc(k.nama) + '" aria-label="Nama ' + tb.kolom + ' ' + (i + 1) + '"></th>';
      }).join('') + '</tr>';
      var badan = tb.baris.map(function (b) {
        return '<tr><td>' + teks(b.label) + (b.opsional ? ' <span class="kecil redup">(opsional)</span>' : '') + '</td><td>' + (b.simbol || '') + '</td><td>' + teks(b.satuan) + '</td>' +
          data.map(function (k, i) {
            return '<td><input type="text" inputmode="decimal" autocomplete="off" data-tabel="' + tb.id + '" data-i="' + i + '" data-k="' + b.id + '" value="' + esc(teksAngka(k[b.id])) + '" aria-label="' + esc(teks(b.label).replace(/<[^>]+>/g, '') + ', ' + tb.kolom + ' ' + (k.nama || i + 1)) + '"></td>';
          }).join('') + '</tr>';
      }).join('');
      return kepalaTabel +
        '<div class="tabel-gulir"><table class="tabel-isian"><thead>' + kepala + '</thead><tbody>' + badan + '</tbody></table></div>' +
        '<div class="baris-tombol tidak-cetak">' +
        (data.length < (tb.maks || 10) ? '<button type="button" class="tombol kecil" data-tambah-kolom="' + tb.id + '">+ ' + tb.kolom + '</button>' : '') +
        (data.length > (tb.min || 1) ? '<button type="button" class="tombol kecil" data-kurang-kolom="' + tb.id + '">− ' + tb.kolom + '</button>' : '') + '</div>';
    }

    function htmlIdentitas() {
      return '<details class="identitas tidak-cetak"><summary>Identitas contoh (untuk kop cetak dan Word)</summary><div class="isian-kisi" style="margin-top:12px">' +
        IDENTITAS.map(function (p) {
          return '<div><label for="id-' + p[0] + '">' + p[1] + '</label><input id="id-' + p[0] + '" data-identitas="' + p[0] + '" type="text" autocomplete="off" value="' + esc(identitas[p[0]] || '') + '"></div>';
        }).join('') + '</div><p class="kecil redup">Identitas hanya disimpan di browser ini dan tidak ikut dalam tautan berbagi.</p></details>';
    }

    function gambarFormulir() {
      var el = document.getElementById('formulir-praktikum');
      el.innerHTML = htmlIdentitas() + htmlImpor() + htmlParameter() + def.tabel.map(htmlTabel).join('') +
        '<div class="baris-tombol tidak-cetak" style="margin-top:22px">' +
        '<button type="button" class="tombol kecil" data-aksi="contoh">Muat data contoh</button>' +
        '<button type="button" class="tombol kecil" data-aksi="kosong">Kosongkan</button>' +
        '<button type="button" class="tombol kecil" data-aksi="word">Unduh Word</button>' +
        '<button type="button" class="tombol kecil" data-aksi="salin-excel">Salin ke Excel</button>' +
        '<button type="button" class="tombol kecil" data-aksi="csv">Unduh CSV</button>' +
        '<button type="button" class="tombol kecil" data-aksi="tautan">Salin tautan</button>' +
        '<button type="button" class="tombol kecil" data-aksi="cetak">Cetak / PDF</button></div>' +
        '<p class="kecil redup" id="pesan-praktikum" role="status" aria-live="polite"></p>';
    }

    // ---------------- hasil
    function kosongSemua(m) {
      var tabelKosong = def.tabel.every(function (tb) {
        return tb.jenis === 'baris' ? !m.tabel[tb.id].some(function (b) { return isFinite(b.nilai); }) : !m.tabel[tb.id].length;
      });
      if (def.tabel.length) return tabelKosong;
      return (def.parameter || []).every(function (p) { return p.pilihan || !isFinite(m.param[p.id]); });
    }

    function gambarHasil() {
      var m = masukan(), el = document.getElementById('hasil-praktikum'), h = '';
      m.tidakLengkap.forEach(function (n) { h += '<div class="catatan">' + n + ' belum lengkap, jadi belum ikut dihitung.</div>'; });
      if (!m.tidakLengkap.length && kosongSemua(m)) {
        el.innerHTML = '<h2>Hasil</h2><div class="kartu redup">Isi data di formulir, atau klik <strong>Muat data contoh</strong> untuk melihat contoh hasilnya.</div>';
        return null;
      }
      var r = def.hitung(m);
      if (r.galat && r.galat.length) {
        el.innerHTML = '<h2>Hasil</h2>' + h + r.galat.map(function (g) { return '<div class="catatan galat">' + g + '</div>'; }).join('');
        return null;
      }
      (r.peringatan || []).forEach(function (p) { h += '<div class="catatan">' + p + '</div>'; });
      el.innerHTML = '<h2>Hasil</h2>' + h + def.tampil(m, r, bantu);
      document.getElementById('kop-cetak').innerHTML = kop();
      if (def.hasil) simpanHasil(def.id, def.hasil(m, r), keadaan.contoh);
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
    function judulEkspor() { return def.judulEkspor || document.title.split(' · ')[0]; }
    function tabelEkspor() {
      var m = masukan(), r = def.hitung(m);
      var baris = [[judulEkspor()]];
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
    function labelPilihan(daftar, v) { var o = daftar.filter(function (x) { return String(x[0]) === String(v); })[0]; return o ? o[1] : ''; }

    // Blok laporan Word: data masukan dari formulir, lalu ringkasan, grafik, dan tabel dari bagian hasil.
    function blokWord() {
      var blok = [{ jenis: 'subjudul', teks: 'Data pengujian' }];
      var nilaiParam = (def.parameter || []).filter(function (p) { return !p.tampilJika || p.tampilJika(keadaan.param); }).map(function (p) {
        var v = p.pilihan ? labelPilihan(p.pilihan, keadaan.param[p.id]) : teksAngka(keadaan.param[p.id]);
        return [p.label, p.satuan || '–', esc(v === '' || v === undefined ? '–' : v)];
      });
      if (nilaiParam.length) blok.push({ jenis: 'tabel', judul: 'Parameter pengujian', kepala: ['Besaran', 'Satuan', 'Nilai'], baris: nilaiParam, kanan: [2] });
      def.tabel.forEach(function (tb) {
        var data = keadaan.tabel[tb.id];
        if (tb.jenis === 'baris') {
          var bb = data.filter(function (b) { return isFinite(angka(b.nilai)); });
          if (bb.length) blok.push({ jenis: 'tabel', judul: tb.judul, kepala: [tb.namaBaris, tb.kolomNilai.label], baris: bb.map(function (b) { return [esc(b.nama), teksAngka(b.nilai)]; }), kanan: [1] });
        } else if (tb.jenis === 'daftar') {
          var kol = kolomDaftar(tb);
          var terisi = data.filter(function (b) { return kol.some(function (k) { return !k.kunci && (k.teks ? String(b[k.id] || '').trim() : kolomAngka(k) && isFinite(angka(b[k.id]))); }); });
          if (terisi.length) {
            blok.push({ jenis: 'tabel', judul: tb.judul, kepala: ['No.'].concat(kol.map(function (k) { return k.label + (k.satuan ? ' (' + k.satuan + ')' : ''); })),
              baris: terisi.map(function (b) {
                return [String(data.indexOf(b) + 1)].concat(kol.map(function (k) {
                  if (k.pilihan) return esc(labelPilihan(k.pilihan, b[k.id] || k.pilihan[0][0]));
                  return k.teks ? esc(b[k.id] || '') : teksAngka(b[k.id]);
                }));
              }), kanan: kol.map(function (k, i) { return kolomAngka(k) ? i + 1 : -1; }) });
          }
        } else {
          var kk = data.filter(function (k) { return tb.baris.some(function (b) { return isFinite(angka(k[b.id])); }); });
          if (kk.length) {
            blok.push({ jenis: 'tabel', judul: tb.judul, kepala: ['Uraian', 'Simbol', 'Satuan'].concat(kk.map(function (k) { return tb.kolom + ' ' + esc(k.nama); })),
              baris: tb.baris.map(function (b) { return [teks(b.label), b.simbol || '', teks(b.satuan)].concat(kk.map(function (k) { return teksAngka(k[b.id]); })); }),
              kanan: kk.map(function (k, i) { return i + 3; }) });
          }
        }
      });
      blok.push({ jenis: 'subjudul', teks: 'Hasil pengolahan' });
      var judulTerakhir = '';
      Array.prototype.forEach.call(document.getElementById('hasil-praktikum').children, function (el) {
        if (el.tagName === 'H3') { judulTerakhir = el.textContent; return; }
        if (el.classList.contains('ringkasan')) {
          blok.push({ jenis: 'tabel', judul: 'Ringkasan hasil', kepala: ['Besaran', 'Nilai', 'Keterangan'], kanan: [1],
            baris: Array.prototype.map.call(el.querySelectorAll('.kartu'), function (k) {
              var d = k.children;
              return [d[0] ? d[0].innerHTML : '', d[1] ? d[1].innerHTML.replace(/<\/?small>/g, ' ').replace(/\s+/g, ' ') : '', d[2] ? d[2].innerHTML : ''];
            }) });
        } else if (el.tagName === 'FIGURE') {
          var svg = el.querySelector('svg'), cap = el.querySelector('figcaption');
          if (svg) blok.push({ jenis: 'gambar', svg: svg, judul: cap ? cap.textContent.split('. ')[0].replace(/\.$/, '') : '' });
        } else if (el.classList.contains('tabel-gulir')) {
          var t = el.querySelector('table'), th = t.querySelectorAll('thead th');
          blok.push({ jenis: 'tabel', judul: judulTerakhir || 'Hasil',
            kanan: Array.prototype.map.call(th, function (x, i) { return x.classList.contains('angka') ? i : -1; }),
            kepala: Array.prototype.map.call(th, function (x) { return x.innerHTML; }),
            baris: Array.prototype.map.call(t.querySelectorAll('tbody tr'), function (tr) { return Array.prototype.map.call(tr.children, function (td) { return td.innerHTML; }); }),
            kaki: t.querySelector('tfoot tr') ? Array.prototype.map.call(t.querySelector('tfoot tr').children, function (td) { return td.innerHTML; }) : null });
          judulTerakhir = '';
        }
      });
      return blok;
    }

    // Tempel blok sel dari Excel mulai dari isian yang sedang aktif.
    function tempel(tbId, i0, k0, grid) {
      var tb = tabelDef(tbId), data = keadaan.tabel[tbId], jumlah = 0;
      if (tb.jenis === 'daftar') {
        var ids = kolomDaftar(tb).map(function (k) { return k.id; }), c0 = ids.indexOf(k0);
        grid.forEach(function (baris, r) {
          var i = i0 + r;
          if (i >= (tb.maks || 60)) return;
          while (data.length <= i) data.push({});
          baris.forEach(function (v, c) { if (ids[c0 + c] !== undefined) { data[i][ids[c0 + c]] = v.trim(); jumlah++; } });
        });
      } else if (tb.jenis === 'baris') {
        grid.forEach(function (baris, r) { if (data[i0 + r]) { data[i0 + r].nilai = baris[0].trim(); jumlah++; } });
      } else {
        var idb = tb.baris.map(function (b) { return b.id; }), b0 = idb.indexOf(k0);
        if (b0 < 0) return 0;
        grid.forEach(function (baris, r) {
          if (idb[b0 + r] === undefined) return;
          baris.forEach(function (v, c) {
            var i = i0 + c;
            if (i >= (tb.maks || 10)) return;
            while (data.length <= i) data.push({ nama: String(data.length + 1) });
            data[i][idb[b0 + r]] = v.trim(); jumlah++;
          });
        });
      }
      return jumlah;
    }

    function aksi(nama) {
      if (nama === 'contoh') { keadaan = lengkapi(contoh()); perbarui(true); pesan('Data contoh dimuat. Angkanya hanya contoh, bukan data pengujian sungguhan.'); }
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
        root.Ekspor.unduh(new Blob([csv], { type: 'text/csv;charset=utf-8' }), def.id + '.csv');
        pesan('Berkas ' + def.id + '.csv diunduh. Pemisah kolom titik koma dan desimal koma, sesuai Excel berbahasa Indonesia.');
      }
      if (nama === 'word') {
        if (!gambarHasil()) { pesan('Belum ada hasil untuk diekspor. Lengkapi data atau perbaiki galat dulu.'); return; }
        pesan('Menyiapkan berkas Word…');
        root.Ekspor.word({ judul: esc(judulEkspor()), identitas: IDENTITAS.filter(function (p) { return identitas[p[0]]; }).map(function (p) { return [p[1], esc(identitas[p[0]])]; }),
          blok: blokWord(), nama: def.id + '.docx' })
          .then(function () { pesan('Berkas ' + def.id + '.docx diunduh: Times New Roman 11, tabel tanpa garis vertikal, nomor tabel dan gambar berurutan. Sesuaikan nomornya dengan bab laporan.'); },
            function (e) { pesan('Berkas Word gagal dibuat: ' + e.message); });
      }
    }

    // ---------------- pendengar (delegasi, jadi tetap jalan setelah formulir digambar ulang)
    akar.innerHTML = '<div id="kop-cetak" class="hanya-cetak"></div><form id="formulir-praktikum" class="kartu" autocomplete="off" onsubmit="return false"></form>' +
      '<section id="hasil-praktikum" aria-live="polite"></section>' +
      (def.sumber ? '<section><h2>Acuan</h2><ul class="daftar-bersih">' + def.sumber.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
        '<div class="catatan"><strong>Alat bantu belajar.</strong> Peringatan kuning adalah pemeriksaan kewajaran otomatis, bukan ketentuan standar. Ikuti modul dan arahan asisten laboratorium untuk laporan resmi.</div></section>' : '');
    var form = document.getElementById('formulir-praktikum');
    var adaSyarat = (def.parameter || []).some(function (p) { return p.tampilJika; });
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.tagName === 'SELECT' && t.dataset.param) return; // ditangani 'change'
      if (t.dataset.param) { keadaan.param[t.dataset.param] = t.value; delete keadaan.contoh; perbarui(false); }
      else if (t.dataset.tabel) {
        var tb = keadaan.tabel[t.dataset.tabel], i = +t.dataset.i;
        if (!tb[i]) tb[i] = {};
        tb[i][t.dataset.k] = t.value; delete keadaan.contoh; perbarui(false);
      }
      else if (t.dataset.identitas) { identitas[t.dataset.identitas] = t.value; simpan(KUNCI_IDENTITAS, identitas); document.getElementById('kop-cetak').innerHTML = kop(); }
    });
    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.tagName === 'SELECT' && t.dataset.param) { keadaan.param[t.dataset.param] = t.value; delete keadaan.contoh; perbarui(adaSyarat); }
    });
    form.addEventListener('paste', function (e) {
      var t = e.target;
      if (!t.dataset || !t.dataset.tabel || t.classList.contains('nama-kolom')) return;
      var teks = (e.clipboardData || window.clipboardData).getData('text');
      if (!/[\t\n]/.test(teks.replace(/[\r\n]+$/, ''))) return; // satu nilai: biarkan browser menempel biasa
      e.preventDefault();
      var grid = teks.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(function (b) { return b.split('\t'); });
      var n = tempel(t.dataset.tabel, +t.dataset.i, t.dataset.k, grid);
      delete keadaan.contoh;
      perbarui(true);
      pesan(n + ' sel ditempel dari papan klip.');
    });
    form.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      var d = t.dataset;
      if (d.aksi) return aksi(d.aksi);
      if (d.impor !== undefined) {
        var im = def.impor[+d.impor], h = bacaHasil(im.alat), isi = im.isi(h.nilai), n = 0;
        Object.keys(isi).forEach(function (k) {
          var v = isi[k];
          if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return;
          keadaan.param[k] = typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v; n++;
        });
        delete keadaan.contoh; perbarui(true);
        pesan(n + ' nilai diambil dari ' + im.nama + (h.contoh ? ' (data contoh).' : '.') + ' Periksa kembali sebelum dipakai.');
        return;
      }
      if (d.ambil) {
        var p = def.parameter.filter(function (x) { return x.id === d.ambil; })[0], hh = bacaHasil(p.dariAlat.alat);
        keadaan.param[p.id] = Math.round(p.dariAlat.ambil(hh.nilai) * 1e4) / 1e4;
        delete keadaan.contoh; perbarui(true); pesan('Nilai dari ' + p.dariAlat.nama + ' dipakai.');
        return;
      }
      if (d.tambahKolom) { var tk = keadaan.tabel[d.tambahKolom]; tk.push({ nama: String(tk.length + 1) }); perbarui(true); }
      if (d.kurangKolom) { keadaan.tabel[d.kurangKolom].pop(); perbarui(true); }
      if (d.hapusBaris) { keadaan.tabel[d.hapusBaris].splice(+d.i, 1); perbarui(true); }
      if (d.tambahDaftar) {
        var dt = keadaan.tabel[d.tambahDaftar], maks = tabelDef(d.tambahDaftar).maks || 60;
        for (var j = 0; j < +d.n && dt.length < maks; j++) dt.push({});
        perbarui(true);
      }
      if (d.tambahBaris) {
        var pilih = form.querySelector('[data-tambah-pilihan="' + d.tambahBaris + '"]').value;
        var def2 = tabelDef(d.tambahBaris), daftar = keadaan.tabel[d.tambahBaris];
        daftar.push({ nama: pilih });
        daftar.sort(function (a, b) { return def2.pilihanBaris.indexOf(a.nama) - def2.pilihanBaris.indexOf(b.nama); });
        perbarui(true);
      }
    });
    // Enter pindah ke isian di bawahnya, seperti mengisi lembar data.
    form.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
      e.preventDefault();
      var t = e.target;
      if (!t.dataset.tabel) return;
      var jenis = tabelDef(t.dataset.tabel).jenis, kunci = jenis === 'daftar' || jenis === 'baris' ? 'k' : 'i';
      var cocok = Array.prototype.slice.call(form.querySelectorAll('input[data-tabel="' + t.dataset.tabel + '"]:not(.nama-kolom)'))
        .filter(function (x) { return x.dataset[kunci] === t.dataset[kunci]; });
      var i = cocok.indexOf(t);
      if (i >= 0 && i < cocok.length - 1) cocok[i + 1].focus();
    });
    document.getElementById('hasil-praktikum').addEventListener('click', function (e) {
      var t = e.target.closest('button[data-png]');
      if (!t) return;
      var svg = t.closest('figure').querySelector('svg');
      var nama = def.id + '-' + ((svg.getAttribute('aria-label') || 'grafik').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) + '.png';
      root.Ekspor.png(svg, nama).then(function () { pesan('Grafik diunduh sebagai ' + nama + '.'); }, function (err) { pesan('Grafik gagal diunduh: ' + err.message); });
    });

    gambarFormulir();
    perbarui(false);
  }

  root.Praktikum = { pasang: pasang, angka: angka, bacaHasil: bacaHasil, simpanHasil: simpanHasil };
})(this);
