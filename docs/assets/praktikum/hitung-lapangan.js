/*
 * Uji lapangan: sondir (SNI 2827:2008) dan Standard Penetration Test (SNI 4153:2008).
 *
 * Sondir (mengikuti kolom form laboratorium):
 *   HL = JP − PK                       hambatan lekat (kg/cm²)
 *   HL × interval / faktor             hambatan lekat per interval (kg/cm), interval 20 cm, faktor alat 10
 *   JHL = Σ (HL × interval / faktor)   jumlah hambatan lekat (kg/cm)
 *   HS = HL / faktor                   hambatan setempat (kg/cm²)
 *   FR = HS / PK × 100%                rasio gesekan
 *
 * SPT:
 *   N = N2 + N3 (jumlah pukulan 15 cm kedua dan ketiga);  N60 = N × Er / 60 bila efisiensi energi Er diketahui.
 *   Kepadatan pasir dan konsistensi lempung menurut N (Terzaghi & Peck):
 *     pasir:   0–4 sangat lepas, 4–10 lepas, 10–30 sedang, 30–50 padat, > 50 sangat padat
 *     lempung: < 2 sangat lunak, 2–4 lunak, 4–8 sedang, 8–15 kaku, 15–30 sangat kaku, > 30 keras
 */
(function (root) {
  'use strict';

  function sondir(m) {
    var galat = [], peringatan = [];
    var interval = m.interval > 0 ? m.interval : 20, faktor = m.faktor > 0 ? m.faktor : 10;
    if (m.bacaan.length < 2) galat.push('Isi minimal dua kedalaman bacaan.');
    var b = m.bacaan.slice().sort(function (x, y) { return x.kedalaman - y.kedalaman; });
    b.forEach(function (x) {
      if (x.JP < x.PK) galat.push('Kedalaman ' + String(x.kedalaman).replace('.', ',') + ' m: JP tidak boleh lebih kecil dari PK.');
      if (x.PK < 0) galat.push('Kedalaman ' + String(x.kedalaman).replace('.', ',') + ' m: PK tidak boleh negatif.');
    });
    if (galat.length) return { galat: galat };
    var jhl = 0;
    var titik = b.map(function (x) {
      var HL = x.JP - x.PK, per = HL * interval / faktor;
      jhl += per;
      var HS = HL / faktor;
      return Object.assign({}, x, { HL: HL, HLper: per, JHL: jhl, HS: HS, FR: x.PK > 0 ? HS / x.PK * 100 : null, qcMPa: x.PK * 0.0980665 });
    });
    var maks = titik.reduce(function (a, t) { return t.PK > a.PK ? t : a; });
    var hasil = { galat: [], peringatan: peringatan, titik: titik, interval: interval, faktor: faktor, maks: maks, akhir: titik[titik.length - 1], JHL: jhl };
    var celah = b.some(function (x, i) { return i > 0 && Math.abs(x.kedalaman - b[i - 1].kedalaman - interval / 100) > 1e-6; });
    if (celah) peringatan.push('Jarak antarbacaan tidak seragam ' + String(interval).replace('.', ',') + ' cm. JHL tetap dijumlahkan per baris seperti form; periksa baris yang hilang.');
    return hasil;
  }

  // Batas kelas: pasir memakai "sampai dengan" (≤ 4, ≤ 10, ≤ 30, ≤ 50), lempung memakai "kurang dari" kecuali 15–30.
  function keadaan(jenis, N) {
    if (!isFinite(N)) return null;
    if (jenis === 'pasir' || jenis === 'kerikil') return N <= 4 ? 'Sangat lepas' : N <= 10 ? 'Lepas' : N <= 30 ? 'Sedang' : N <= 50 ? 'Padat' : 'Sangat padat';
    if (jenis === 'lempung' || jenis === 'lanau') return N < 2 ? 'Sangat lunak' : N < 4 ? 'Lunak' : N < 8 ? 'Sedang' : N < 15 ? 'Kaku' : N <= 30 ? 'Sangat kaku' : 'Keras';
    return null;
  }

  function spt(m) {
    var galat = [], peringatan = [];
    var lapisan = (m.lapisan || []).slice().sort(function (a, b) { return a.dari - b.dari; });
    lapisan.forEach(function (l) { if (!(l.sampai > l.dari)) galat.push('Lapisan ' + l.no + ': kedalaman "sampai" harus lebih besar dari "dari".'); });
    if (!m.uji.length && !lapisan.length) galat.push('Isi data SPT atau lapisan tanah.');
    if (galat.length) return { galat: galat };
    function lapisanDi(z) { return lapisan.filter(function (l) { return z >= l.dari - 1e-9 && z <= l.sampai + 1e-9; })[0] || null; }
    var uji = m.uji.slice().sort(function (a, b) { return a.kedalaman - b.kedalaman; }).map(function (u) {
      var N = (u.N2 || 0) + (u.N3 || 0), lap = lapisanDi(u.kedalaman), jenis = lap ? lap.jenis : null;
      var o = Object.assign({}, u, { N: N, jenis: jenis, lapisan: lap, keadaan: keadaan(jenis, N), tolak: (u.N1 >= 50 || u.N2 >= 50 || u.N3 >= 50) }); // 50 pukulan dalam satu interval 15 cm
      if (m.Er > 0) o.N60 = N * m.Er / 60;
      return o;
    });
    uji.forEach(function (u) { if (u.tolak) peringatan.push('Kedalaman ' + String(u.kedalaman).replace('.', ',') + ' m: 50 pukulan dalam satu interval 15 cm (penolakan). Catat penetrasi yang tercapai di deskripsi.'); });
    var celah = lapisan.some(function (l, i) { return i > 0 && l.dari > lapisan[i - 1].sampai + 1e-6; });
    if (celah) peringatan.push('Ada kedalaman yang tidak tercakup lapisan mana pun. Periksa kolom dari–sampai.');
    return { galat: [], peringatan: peringatan, uji: uji, lapisan: lapisan, MAT: m.MAT, Er: m.Er,
      dalam: Math.max(lapisan.length ? lapisan[lapisan.length - 1].sampai : 0, uji.length ? uji[uji.length - 1].kedalaman + 0.45 : 0) };
  }

  var api = { sondir: sondir, spt: spt, keadaan: keadaan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HitungLapangan = api;
})(this);
