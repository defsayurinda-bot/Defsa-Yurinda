/*
 * Ekspor hasil alat praktikum: grafik ke PNG dan laporan ke Word (.docx).
 *
 * Berkas .docx ditulis langsung (arsip ZIP tanpa kompresi berisi Office Open XML), tanpa pustaka luar.
 * Format mengikuti panduan laporan praktikum: kertas A4, margin 4-3-3-3 cm, Times New Roman,
 * teks tabel 11 pt spasi tunggal, tabel tanpa garis vertikal, nomor tabel tebal di atas tabel,
 * nomor gambar di bawah gambar.
 *
 * Ekspor.png(svg, nama)                     unduh satu grafik sebagai PNG berlatar putih
 * Ekspor.word({ judul, subjudul, identitas: [[label, nilai]], blok: [...], nama })
 *   blok: { jenis: 'subjudul', teks }
 *         { jenis: 'tabel', judul, kepala: [sel…], baris: [[sel…]…], kaki: [sel…], kanan: [indeks kolom rata kanan] }
 *         { jenis: 'gambar', svg, judul }
 *         { jenis: 'paragraf', teks }
 *   Sel boleh berisi HTML sederhana: <sub>, <sup>, <strong>, <em>; tag lain dibuang.
 */
(function (root) {
  'use strict';

  // Grafik di layar memakai variabel CSS (ikut mode gelap). Untuk berkas, warna dikunci ke palet terang.
  // Warna tetap untuk grafik PNG dan Word: token mode terang di gaya.css (konsep A).
  var PALET = { '--aksen': '#b23c0c', '--teks': '#1a1a1a', '--teks-2': '#595959', '--garis': '#d9d9d9', '--permukaan': '#ffffff',
    '--permukaan-2': '#f4f4f4', '--latar': '#ffffff', '--sukses': '#1f7a4d', '--pasir': '#ecd9a4', '--lempung': '#b99478' };

  function svgMandiri(svg) {
    var vb = svg.viewBox.baseVal, s = new XMLSerializer().serializeToString(svg);
    s = s.replace(/var\((--[a-z0-9-]+)\)/g, function (_, n) { return PALET[n] || '#000000'; });
    var tambah = ' width="' + vb.width + '" height="' + vb.height + '" font-family="Arial, Helvetica, sans-serif"';
    if (!/^<svg[^>]*xmlns=/.test(s)) tambah += ' xmlns="http://www.w3.org/2000/svg"';
    return s.replace(/^<svg/, '<svg' + tambah);
  }

  // SVG → PNG (skala 3 supaya tajam saat dicetak).
  function kePng(svg, skala) {
    skala = skala || 3;
    var vb = svg.viewBox.baseVal, w = vb.width, h = vb.height;
    return new Promise(function (berhasil, gagal) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = Math.round(w * skala); c.height = Math.round(h * skala);
        var g = c.getContext('2d');
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { if (b) berhasil({ blob: b, lebar: w, tinggi: h }); else gagal(new Error('Kanvas gagal diubah ke PNG.')); }, 'image/png');
      };
      img.onerror = function () { gagal(new Error('Grafik gagal digambar ulang.')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMandiri(svg));
    });
  }

  function unduh(blob, nama) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function png(svg, nama) { return kePng(svg).then(function (h) { unduh(h.blob, nama); }); }

  // ---------------------------------------------------------------- ZIP tanpa kompresi
  var TABEL_CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(data) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < data.length; i++) c = TABEL_CRC[(c ^ data[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function utf8(s) { return new TextEncoder().encode(s); }

  function zip(berkas) {
    var bagian = [], pusat = [], posisi = 0;
    function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
    function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }
    var waktu = 0, tanggal = (2026 - 1980) << 9 | 1 << 5 | 1; // tanggal tetap supaya hasil deterministik
    berkas.forEach(function (b) {
      var nama = utf8(b.nama), data = typeof b.data === 'string' ? utf8(b.data) : b.data, crc = crc32(data);
      var kepala = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(waktu), u16(tanggal), u32(crc), u32(data.length), u32(data.length), u16(nama.length), u16(0));
      bagian.push(new Uint8Array(kepala), nama, data);
      pusat.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(waktu), u16(tanggal), u32(crc), u32(data.length), u32(data.length),
        u16(nama.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(posisi))), nama);
      posisi += kepala.length + nama.length + data.length;
    });
    var ukuranPusat = pusat.reduce(function (a, b) { return a + b.length; }, 0);
    var akhir = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(berkas.length), u16(berkas.length), u32(ukuranPusat), u32(posisi), u16(0)));
    return new Blob(bagian.concat(pusat, [akhir]), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  // ---------------------------------------------------------------- Office Open XML
  var NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  function x(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // HTML sederhana → rangkaian w:r (menjaga subskrip, superskrip, tebal, miring).
  function runs(html, dasar) {
    dasar = dasar || {};
    var wadah = document.createElement('div'), hasil = '';
    wadah.innerHTML = String(html == null ? '' : html).replace(/<br\s*\/?>/gi, ' ');
    (function jalan(node, gaya) {
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) {
          var t = n.nodeValue.replace(/\s+/g, ' ');
          if (!t) return;
          var pr = (gaya.b ? '<w:b/>' : '') + (gaya.i ? '<w:i/>' : '') + (gaya.va ? '<w:vertAlign w:val="' + gaya.va + '"/>' : '') + (gaya.sz ? '<w:sz w:val="' + gaya.sz + '"/><w:szCs w:val="' + gaya.sz + '"/>' : '');
          hasil += '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + x(t) + '</w:t></w:r>';
        } else if (n.nodeType === 1) {
          var tag = n.tagName.toLowerCase(), g = Object.assign({}, gaya);
          if (tag === 'sub') g.va = 'subscript';
          if (tag === 'sup') g.va = 'superscript';
          if (tag === 'strong' || tag === 'b') g.b = true;
          if (tag === 'em' || tag === 'i') g.i = true;
          if (tag === 'script' || tag === 'style' || tag === 'button') return;
          jalan(n, g);
        }
      });
    })(wadah, dasar);
    return hasil;
  }

  function paragraf(isi, o) {
    o = o || {};
    var pr = (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '') + (o.keep ? '<w:keepNext/>' : '') +
      '<w:spacing w:before="' + (o.sebelum || 0) + '" w:after="' + (o.sesudah || 0) + '"/>';
    return '<w:p><w:pPr>' + pr + '</w:pPr>' + isi + '</w:p>';
  }

  var LEBAR_TEKS = 7938; // 14 cm dalam twip (A4 21 cm − margin 4 cm − 3 cm)
  var GARIS = 'w:val="single" w:sz="8" w:space="0" w:color="000000"';

  function tabel(b) {
    var n = Math.max(b.kepala ? b.kepala.length : 0, (b.baris[0] || []).length);
    var kanan = b.kanan || [];
    function baris(sel2, o) {
      var isi = sel2.slice(0, n);
      while (isi.length < n) isi.push('');
      return '<w:tr>' + (o.kepala ? '<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' : '<w:trPr><w:cantSplit/></w:trPr>') +
        isi.map(function (c, i) { return sel(c, i, o); }).join('') + '</w:tr>';
    }
    // Lebar kolom menurut isi terpanjang (angka tidak boleh terpotong), dipersempit bila melebihi lebar teks.
    function panjang(html) { var d = document.createElement('div'); d.innerHTML = String(html == null ? '' : html); return d.textContent.trim(); }
    var karakter = [];
    for (var i = 0; i < n; i++) {
      var isiTerpanjang = b.baris.concat(b.kaki ? [b.kaki] : []).reduce(function (a, r) { return Math.max(a, panjang(r[i]).length); }, 0);
      var kataKepala = b.kepala ? panjang(b.kepala[i]).split(/\s+/).reduce(function (a, k) { return Math.max(a, k.length); }, 0) : 0;
      karakter.push(Math.min(30, Math.max(isiTerpanjang, kataKepala))); // teks panjang dibungkus, bukan mengecilkan huruf
    }
    // Ukuran huruf 11 pt; tabel yang terlalu lebar untuk 14 cm diperkecil sampai paling kecil 8 pt.
    function lebarUntuk(sz) { return karakter.map(function (c) { return Math.max(Math.round(560 * sz / 22), Math.round((c * 115 + 240) * sz / 22)); }); }
    var sz = 22, lebar = lebarUntuk(sz), jumlah = function (l) { return l.reduce(function (a, v) { return a + v; }, 0); };
    while (jumlah(lebar) > LEBAR_TEKS && sz > 16) { sz--; lebar = lebarUntuk(sz); }
    var total = jumlah(lebar);
    if (total > LEBAR_TEKS) { lebar = lebar.map(function (v) { return Math.floor(v * LEBAR_TEKS / total); }); total = jumlah(lebar); }
    function sel(isi, i, o) {
      var jc = o.kepala ? 'center' : (kanan.indexOf(i) >= 0 ? 'right' : 'left');
      var batas = o.kepala ? '<w:tcBorders><w:bottom ' + GARIS + '/></w:tcBorders>' : o.kaki ? '<w:tcBorders><w:top ' + GARIS + '/></w:tcBorders>' : '';
      return '<w:tc><w:tcPr><w:tcW w:w="' + lebar[i] + '" w:type="dxa"/>' + batas + '<w:vAlign w:val="center"/></w:tcPr>' +
        paragraf(runs(isi, { b: o.kepala || o.kaki, sz: sz === 22 ? 0 : sz }), { jc: jc }) + '</w:tc>';
    }
    return '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/><w:jc w:val="center"/>' +
      '<w:tblBorders><w:top ' + GARIS + '/><w:left w:val="nil"/><w:bottom ' + GARIS + '/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>' +
      '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="20" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="20" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
      '<w:tblGrid>' + lebar.map(function (v) { return '<w:gridCol w:w="' + v + '"/>'; }).join('') + '</w:tblGrid>' +
      (b.kepala ? baris(b.kepala, { kepala: true }) : '') + b.baris.map(function (r) { return baris(r, {}); }).join('') +
      (b.kaki ? baris(b.kaki, { kaki: true }) : '') + '</w:tbl>';
  }

  function gambar(id, rel, lebar, tinggi) {
    var cx = 5040000, cy = Math.round(cx * tinggi / lebar); // lebar 14 cm
    return paragraf('<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
      '<wp:docPr id="' + id + '" name="Gambar ' + id + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + id + '" name="gambar' + id + '.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
      '<pic:blipFill><a:blip r:embed="' + rel + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
      '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>', { jc: 'center', keep: true, sebelum: 120 });
  }

  function word(o) {
    var daftarGambar = o.blok.filter(function (b) { return b.jenis === 'gambar'; });
    return Promise.all(daftarGambar.map(function (b) { return kePng(b.svg); })).then(function (png2) {
      var nTabel = 0, nGambar = 0, media = [], isi = '';
      isi += paragraf(runs(o.judul, { b: true, sz: 24 }), { jc: 'center' });
      if (o.subjudul) isi += paragraf(runs(o.subjudul, { sz: 22 }), { jc: 'center', sesudah: 200 });
      if (o.identitas && o.identitas.length) {
        isi += '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr>' +
          '<w:tblGrid><w:gridCol w:w="2200"/><w:gridCol w:w="5700"/></w:tblGrid>' +
          o.identitas.map(function (r) {
            return '<w:tr><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr>' + paragraf(runs(r[0])) + '</w:tc><w:tc><w:tcPr><w:tcW w:w="5700" w:type="dxa"/></w:tcPr>' + paragraf(runs(': ' + r[1])) + '</w:tc></w:tr>';
          }).join('') + '</w:tbl>' + paragraf('');
      }
      o.blok.forEach(function (b) {
        if (b.jenis === 'subjudul') isi += paragraf(runs(b.teks, { b: true }), { sebelum: 240, sesudah: 60, keep: true });
        if (b.jenis === 'paragraf') isi += paragraf(runs(b.teks), { sesudah: 120 });
        if (b.jenis === 'tabel') {
          nTabel++;
          isi += paragraf('<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Tabel ' + nTabel + ' </w:t></w:r>' + runs(b.judul || ''), { jc: 'center', keep: true, sebelum: 200, sesudah: 60 });
          isi += tabel(b);
          if (b.sumber) isi += paragraf(runs('(Sumber: ' + b.sumber + ')', { sz: 20 }), { jc: 'center' });
        }
        if (b.jenis === 'gambar') {
          var p = png2[nGambar++], rel = 'rIdG' + nGambar;
          media.push({ nama: 'word/media/gambar' + nGambar + '.png', blob: p.blob, rel: rel });
          isi += gambar(nGambar, rel, p.lebar, p.tinggi);
          isi += paragraf('<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Gambar ' + nGambar + ' </w:t></w:r>' + runs(b.judul || ''), { jc: 'center', sesudah: 200 });
        }
      });
      var dokumen = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="' + NS_W + '" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>' + isi +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>';
      var gaya = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="' + NS_W + '"><w:docDefaults><w:rPrDefault><w:rPr>' +
        '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="id-ID"/>' +
        '</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
        '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';
      var relDok = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rIdGaya" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        media.map(function (m) { return '<Relationship Id="' + m.rel + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="' + m.nama.replace('word/', '') + '"/>'; }).join('') +
        '</Relationships>';
      var jenis = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Default Extension="png" ContentType="image/png"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';
      var relAkar = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
      return Promise.all(media.map(function (m) { return m.blob.arrayBuffer(); })).then(function (isiMedia) {
        var berkas = [{ nama: '[Content_Types].xml', data: jenis }, { nama: '_rels/.rels', data: relAkar },
          { nama: 'word/document.xml', data: dokumen }, { nama: 'word/styles.xml', data: gaya }, { nama: 'word/_rels/document.xml.rels', data: relDok }]
          .concat(media.map(function (m, i) { return { nama: m.nama, data: new Uint8Array(isiMedia[i]) }; }));
        var blob = zip(berkas);
        if (o.nama) unduh(blob, o.nama);
        return blob;
      });
    });
  }

  root.Ekspor = { png: png, kePng: kePng, word: word, unduh: unduh, svgMandiri: svgMandiri };
})(this);
