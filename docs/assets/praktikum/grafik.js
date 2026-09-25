/*
 * Pembuat grafik SVG sederhana untuk alat praktikum.
 * Mendukung sumbu linier dan logaritmik (termasuk sumbu terbalik), garis, titik, area, dan label.
 * Warna memakai variabel CSS situs, jadi otomatis menyesuaikan mode terang dan gelap.
 *
 * Grafik.plot({
 *   judul, lebar, tinggi,
 *   x: { min, max, log, balik, label, tick: [angka…] (opsional), format: fn },
 *   y: { min, max, label, tick, format },
 *   seri: [{ titik: [[x, y], …], garis: true, penanda: true, warna: 'aksen'|'teks'|'biru'|'hijau', putus: true, label, tebal }],
 *   area: [{ titik: [[x, y], …], warna }],           poligon terisi tipis
 *   tanda: [{ x, y, teks, posisi: 'kanan'|'kiri'|'atas' }],
 *   vertikal: [{ x, teks }], horizontal: [{ y, teks }]
 * }) → string SVG
 */
(function (root) {
  'use strict';

  var WARNA = { aksen: 'var(--aksen)', teks: 'var(--teks)', redup: 'var(--teks-2)', biru: '#3a7fc1', hijau: 'var(--sukses)', ungu: '#8a5cc7' };

  function angka(x, d) {
    return x.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function tickLinier(min, max, jumlah) {
    var rentang = max - min, kasar = rentang / (jumlah || 5);
    var pangkat = Math.pow(10, Math.floor(Math.log10(kasar))), n = kasar / pangkat;
    var langkah = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * pangkat;
    var hasil = [];
    for (var v = Math.ceil(min / langkah - 1e-9) * langkah; v <= max + 1e-9; v += langkah) hasil.push((Math.round(v / langkah) * langkah) || 0);
    return { nilai: hasil, desimal: Math.max(0, -Math.floor(Math.log10(langkah) + 1e-9)) };
  }

  function tickLog(min, max) {
    var hasil = [];
    for (var e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
      [1, 2, 5].forEach(function (k) {
        var v = k * Math.pow(10, e);
        if (v >= min * 0.999 && v <= max * 1.001) hasil.push(v);
      });
    }
    return hasil;
  }

  function formatLog(v) {
    var d = v >= 1 ? 0 : Math.min(4, -Math.floor(Math.log10(v) + 1e-9));
    return angka(v, d);
  }

  function plot(o) {
    // Di layar sempit grafik digambar lebih kecil supaya teksnya tetap terbaca setelah diskalakan.
    var sempit = typeof window !== 'undefined' && window.innerWidth < 560;
    var W = o.lebar || (sempit ? 430 : 640), H = o.tinggi || (sempit ? 340 : 380);
    var kiri = 64, kanan = 20, atas = 18, bawah = 52;
    var lw = W - kiri - kanan, lh = H - atas - bawah;
    var fx = o.x.log
      ? function (v) { var t = (Math.log10(v) - Math.log10(o.x.min)) / (Math.log10(o.x.max) - Math.log10(o.x.min)); return kiri + (o.x.balik ? 1 - t : t) * lw; }
      : function (v) { var t = (v - o.x.min) / (o.x.max - o.x.min); return kiri + (o.x.balik ? 1 - t : t) * lw; };
    var fy = function (v) { return atas + (1 - (v - o.y.min) / (o.y.max - o.y.min)) * lh; };
    var s = '<svg class="grafik" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.judul || 'Grafik') + '">';
    s += '<defs><clipPath id="klip-' + (o.id || 'g') + '"><rect x="' + kiri + '" y="' + atas + '" width="' + lw + '" height="' + lh + '"/></clipPath></defs>';

    // kisi dan label sumbu
    var tx = o.x.tick || (o.x.log ? tickLog(o.x.min, o.x.max) : tickLinier(o.x.min, o.x.max, 6).nilai);
    var dx = o.x.log ? null : tickLinier(o.x.min, o.x.max, 6).desimal;
    tx.forEach(function (v) {
      var x = fx(v);
      s += '<line x1="' + x + '" x2="' + x + '" y1="' + atas + '" y2="' + (atas + lh) + '" style="stroke:var(--garis)"/>';
      s += '<text x="' + x + '" y="' + (atas + lh + 18) + '" text-anchor="middle" font-size="12" style="fill:var(--teks-2)">' +
        (o.x.format ? o.x.format(v) : o.x.log ? formatLog(v) : angka(v, dx)) + '</text>';
    });
    var ty = o.y.tick || tickLinier(o.y.min, o.y.max, 6).nilai, dy = tickLinier(o.y.min, o.y.max, 6).desimal;
    ty.forEach(function (v) {
      var y = fy(v);
      s += '<line x1="' + kiri + '" x2="' + (kiri + lw) + '" y1="' + y + '" y2="' + y + '" style="stroke:var(--garis)"/>';
      s += '<text x="' + (kiri - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12" style="fill:var(--teks-2)">' +
        (o.y.format ? o.y.format(v) : angka(v, dy)) + '</text>';
    });
    s += '<rect x="' + kiri + '" y="' + atas + '" width="' + lw + '" height="' + lh + '" fill="none" style="stroke:var(--teks-2)"/>';
    s += '<text x="' + (kiri + lw / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="13" style="fill:var(--teks)">' + (o.x.label || '') + '</text>';
    s += '<text x="16" y="' + (atas + lh / 2) + '" text-anchor="middle" font-size="13" transform="rotate(-90 16 ' + (atas + lh / 2) + ')" style="fill:var(--teks)">' + (o.y.label || '') + '</text>';

    s += '<g clip-path="url(#klip-' + (o.id || 'g') + ')">';
    (o.area || []).forEach(function (a) {
      s += '<polygon points="' + a.titik.map(function (p) { return fx(p[0]) + ',' + fy(p[1]); }).join(' ') + '" style="fill:' + (WARNA[a.warna] || a.warna || 'var(--aksen)') + ';opacity:.08"/>';
    });
    (o.vertikal || []).forEach(function (g) {
      s += '<line x1="' + fx(g.x) + '" x2="' + fx(g.x) + '" y1="' + atas + '" y2="' + (atas + lh) + '" style="stroke:var(--teks-2);stroke-dasharray:4 4"/>';
    });
    (o.horizontal || []).forEach(function (g) {
      s += '<line x1="' + kiri + '" x2="' + (kiri + lw) + '" y1="' + fy(g.y) + '" y2="' + fy(g.y) + '" style="stroke:var(--teks-2);stroke-dasharray:4 4"/>';
    });
    (o.seri || []).forEach(function (sr) {
      var warna = WARNA[sr.warna] || WARNA.aksen;
      if (sr.garis !== false && sr.titik.length > 1) {
        s += '<polyline points="' + sr.titik.map(function (p) { return fx(p[0]) + ',' + fy(p[1]); }).join(' ') +
          '" style="fill:none;stroke:' + warna + ';stroke-width:' + (sr.tebal || 2.2) + (sr.putus ? ';stroke-dasharray:7 5' : '') + '"/>';
      }
      if (sr.penanda) {
        sr.titik.forEach(function (p) {
          s += '<circle cx="' + fx(p[0]) + '" cy="' + fy(p[1]) + '" r="4.5" style="fill:var(--permukaan);stroke:' + warna + ';stroke-width:2.2"/>';
        });
      }
    });
    s += '</g>';
    (o.vertikal || []).concat(o.horizontal || []).forEach(function (g) {
      if (!g.teks) return;
      if (g.x !== undefined) s += '<text x="' + (fx(g.x) + 4) + '" y="' + (atas + 14) + '" font-size="12" style="fill:var(--teks-2)">' + g.teks + '</text>';
      else s += '<text x="' + (kiri + 6) + '" y="' + (fy(g.y) - 5) + '" font-size="12" style="fill:var(--teks-2)">' + g.teks + '</text>';
    });
    (o.tanda || []).forEach(function (t) {
      var x = fx(t.x), y = fy(t.y);
      if (t.titik !== false) s += '<circle cx="' + x + '" cy="' + y + '" r="5.5" style="fill:var(--aksen);stroke:var(--permukaan);stroke-width:2"/>';
      var kiriTeks = t.posisi === 'kiri' || t.rata === 'kiri';
      s += '<text x="' + (x + (kiriTeks ? -9 : 9)) + '" y="' + (y + (t.posisi === 'atas' || t.atas ? -10 : 4)) + '" text-anchor="' + (kiriTeks ? 'end' : 'start') +
        '" font-size="12.5" font-weight="700" style="fill:var(--teks);paint-order:stroke;stroke:var(--permukaan);stroke-width:4px">' + t.teks + '</text>';
    });
    // legenda
    var legenda = (o.seri || []).filter(function (sr) { return sr.label; });
    if (legenda.length) {
      var lx = kiri + 10, ly = atas + 12;
      legenda.forEach(function (sr, i) {
        var warna = WARNA[sr.warna] || WARNA.aksen, y = ly + i * 18;
        s += '<line x1="' + lx + '" x2="' + (lx + 22) + '" y1="' + y + '" y2="' + y + '" style="stroke:' + warna + ';stroke-width:2.2' + (sr.putus ? ';stroke-dasharray:6 4' : '') + '"/>';
        s += '<text x="' + (lx + 28) + '" y="' + (y + 4) + '" font-size="12" style="fill:var(--teks);paint-order:stroke;stroke:var(--permukaan);stroke-width:4px">' + sr.label + '</text>';
      });
    }
    return s + '</svg>';
  }

  root.Grafik = { plot: plot, tickLinier: tickLinier };
})(this);
