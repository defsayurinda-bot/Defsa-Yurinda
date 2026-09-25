/*
 * Klasifikasi tanah untuk keperluan teknik.
 *
 * USCS (SNI 6371:2015, mengacu ASTM D2487), tanah anorganik:
 *   Butir halus F = % lolos No. 200, kerikil G = 100 − % lolos No. 4, pasir S = % lolos No. 4 − F.
 *   F ≥ 50%  → tanah berbutir halus, simbol dari bagan plastisitas (garis A: IP = 0,73 (LL − 20)).
 *   F < 50%  → kerikil bila G > S, selain itu pasir.
 *     F < 5%      : GW bila Cu ≥ 4 dan 1 ≤ Cc ≤ 3, selain itu GP; SW bila Cu ≥ 6 dan 1 ≤ Cc ≤ 3, selain itu SP.
 *     5% ≤ F ≤ 12%: simbol ganda, mis. GW-GM (butir halus ML/MH) atau GW-GC (CL, CH, CL-ML).
 *     F > 12%     : GM/SM (ML, MH), GC/SC (CL, CH), GC-GM/SC-SM (CL-ML).
 *   Nama kelompok mengikuti bagan alir ASTM D2487 (dengan pasir/kerikil ≥ 15%, berpasir/berkerikil bila
 *   tertahan No. 200 ≥ 30%). Nama Indonesia adalah terjemahan bebas, nama Inggris adalah nama resmi ASTM.
 *
 * AASHTO M 145: kelompok dicari dari kiri ke kanan tabel, LL dan IP dibulatkan ke bilangan bulat.
 *   Indeks kelompok GI = (F − 35)[0,2 + 0,005 (LL − 40)] + 0,01 (F − 15)(IP − 10);
 *   A-2-6 dan A-2-7 hanya suku IP; A-1-a, A-1-b, A-2-4, A-2-5, A-3 selalu 0; GI negatif dianggap 0; dibulatkan.
 */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var A = node ? require('./hitung-atterberg.js') : root.HitungAtterberg;

  var DASAR_HALUS = {
    'CL': ['Lean clay', 'Lempung plastisitas rendah'], 'CL-ML': ['Silty clay', 'Lempung berlanau'], 'ML': ['Silt', 'Lanau'],
    'CH': ['Fat clay', 'Lempung plastisitas tinggi'], 'MH': ['Elastic silt', 'Lanau elastis']
  };

  // Jenis butir halus: simbol bagan plastisitas, atau ML bila nonplastis.
  function jenisHalus(LL, IP, NP) {
    if (NP || !(IP > 0) || !isFinite(LL)) return 'ML';
    return A.simbolHalus(LL, IP).simbol;
  }

  function uscs(m) {
    var galat = [], peringatan = [];
    var P4 = m.P4, F = m.P200;
    if (!(F >= 0 && F <= 100)) galat.push('Isi persen lolos saringan No. 200 (0–100%).');
    if (!(P4 >= 0 && P4 <= 100)) galat.push('Isi persen lolos saringan No. 4 (0–100%).');
    if (!galat.length && F > P4 + 1e-9) galat.push('Persen lolos No. 200 tidak mungkin lebih besar dari persen lolos No. 4.');
    var NP = m.NP || (isFinite(m.LL) && isFinite(m.PL) && m.PL >= m.LL);
    var IP = NP ? 0 : m.LL - m.PL;
    var perluPlastisitas = F >= 5;
    if (perluPlastisitas && !NP && !(isFinite(m.LL) && isFinite(m.PL))) galat.push('Butir halus ≥ 5%: isi batas cair dan batas plastis, atau pilih nonplastis.');
    if (galat.length) return { galat: galat };

    var G = 100 - P4, S = P4 - F, R = 100 - F;
    var Cu = m.D10 > 0 && m.D60 > 0 ? m.D60 / m.D10 : null;
    var Cc = m.D10 > 0 && m.D30 > 0 && m.D60 > 0 ? m.D30 * m.D30 / (m.D10 * m.D60) : null;
    var hasil = { galat: [], peringatan: peringatan, G: G, S: S, F: F, Cu: Cu, Cc: Cc, IP: IP, NP: NP, LL: m.LL, PL: m.PL };
    var halus = perluPlastisitas || F >= 50 ? jenisHalus(m.LL, IP, NP) : null;
    hasil.jenisHalus = halus;

    if (F >= 50) {
      var d = DASAR_HALUS[halus], en = d[0], id = d[1];
      hasil.kelompok = 'halus';
      hasil.simbol = halus;
      if (R < 15) { hasil.nama = en; hasil.namaId = id; }
      else if (R < 30) {
        if (S >= G) { hasil.nama = en + ' with sand'; hasil.namaId = id + ' dengan pasir'; }
        else { hasil.nama = en + ' with gravel'; hasil.namaId = id + ' dengan kerikil'; }
      } else if (S >= G) {
        hasil.nama = 'Sandy ' + en.toLowerCase() + (G >= 15 ? ' with gravel' : '');
        hasil.namaId = id + ' berpasir' + (G >= 15 ? ' dengan kerikil' : '');
      } else {
        hasil.nama = 'Gravelly ' + en.toLowerCase() + (S >= 15 ? ' with sand' : '');
        hasil.namaId = id + ' berkerikil' + (S >= 15 ? ' dengan pasir' : '');
      }
      if (!NP && IP > A.garisU(m.LL)) peringatan.push('Titik LL–IP di atas garis U. Periksa kembali data Atterberg.');
      peringatan.push('Tanah organik (OL/OH) tidak dibedakan di sini karena butuh batas cair contoh kering oven. Bila tanah berbau organik atau berwarna gelap, ikuti SNI 6371:2015.');
      return hasil;
    }

    var k = G > S ? 'G' : 'S';
    var kerikil = k === 'G';
    var lawan = kerikil ? S : G; // pasir dalam kerikil, atau kerikil dalam pasir
    var namaK = kerikil ? ['gravel', 'Kerikil'] : ['sand', 'Pasir'];
    var tambahan = kerikil ? ['sand', 'pasir'] : ['gravel', 'kerikil'];
    var banyakLawan = lawan >= 15;
    hasil.kelompok = kerikil ? 'kerikil' : 'pasir';

    function gradasi() {
      if (Cu === null || Cc === null) return null;
      var baik = kerikil ? Cu >= 4 : Cu >= 6;
      return baik && Cc >= 1 && Cc <= 3 ? 'W' : 'P';
    }
    var grad = null;
    if (F <= 12) {
      grad = gradasi();
      if (!grad) {
        return { galat: ['Butir halus ' + (F < 5 ? '< 5%' : '5–12%') + ': gradasi (W atau P) butuh D10, D30, dan D60. Isi dari kurva gradasi atau ambil dari alat saringan/hidrometer.'] };
      }
    }
    var enGrad = grad === 'W' ? 'Well-graded ' : 'Poorly graded ', idGrad = grad === 'W' ? ' bergradasi baik' : ' bergradasi buruk';
    var C = halus === 'CL' || halus === 'CH' || halus === 'CL-ML';

    if (F < 5) {
      hasil.simbol = k + grad;
      hasil.nama = enGrad + namaK[0] + (banyakLawan ? ' with ' + tambahan[0] : '');
      hasil.namaId = namaK[1] + idGrad + (banyakLawan ? ' dengan ' + tambahan[1] : '');
    } else if (F <= 12) {
      hasil.simbol = k + grad + '-' + k + (C ? 'C' : 'M');
      var enH = C ? (halus === 'CL-ML' ? 'silty clay' : 'clay') : 'silt';
      var idH = C ? (halus === 'CL-ML' ? 'lempung berlanau' : 'lempung') : 'lanau';
      hasil.nama = enGrad + namaK[0] + ' with ' + enH + (banyakLawan ? ' and ' + tambahan[0] : '');
      hasil.namaId = namaK[1] + idGrad + ' dengan ' + idH + (banyakLawan ? ' dan ' + tambahan[1] : '');
      hasil.ganda = true;
    } else {
      var ganda = halus === 'CL-ML';
      hasil.simbol = ganda ? k + 'C-' + k + 'M' : k + (C ? 'C' : 'M');
      var enA = ganda ? 'Silty, clayey ' : C ? 'Clayey ' : 'Silty ';
      var idA = ganda ? ' berlanau dan berlempung' : C ? ' berlempung' : ' berlanau';
      hasil.nama = enA + namaK[0] + (banyakLawan ? ' with ' + tambahan[0] : '');
      hasil.namaId = namaK[1] + idA + (banyakLawan ? ' dengan ' + tambahan[1] : '');
    }
    hasil.gradasi = grad;
    return hasil;
  }

  var GI_NOL = ['A-1-a', 'A-1-b', 'A-3', 'A-2-4', 'A-2-5'];
  var URAIAN_AASHTO = {
    'A-1': ['Pecahan batu, kerikil, dan pasir', 'Sangat baik sampai baik'],
    'A-3': ['Pasir halus', 'Sangat baik sampai baik'],
    'A-2': ['Kerikil dan pasir berlanau atau berlempung', 'Sangat baik sampai baik'],
    'A-4': ['Tanah berlanau', 'Sedang sampai buruk'], 'A-5': ['Tanah berlanau', 'Sedang sampai buruk'],
    'A-6': ['Tanah berlempung', 'Sedang sampai buruk'], 'A-7': ['Tanah berlempung', 'Sedang sampai buruk']
  };

  function indeksKelompok(kelompok, F, LL, IP) {
    if (GI_NOL.indexOf(kelompok) >= 0) return { GI: 0, mentah: 0 };
    var gi = kelompok === 'A-2-6' || kelompok === 'A-2-7'
      ? 0.01 * (F - 15) * (IP - 10)
      : (F - 35) * (0.2 + 0.005 * (LL - 40)) + 0.01 * (F - 15) * (IP - 10);
    return { GI: Math.max(0, Math.round(gi)), mentah: gi };
  }

  function aashto(m) {
    var galat = [], F = m.P200;
    if (!(F >= 0 && F <= 100)) galat.push('Isi persen lolos saringan No. 200 (0–100%).');
    var NP = m.NP || (isFinite(m.LL) && isFinite(m.PL) && m.PL >= m.LL);
    if (!NP && !(isFinite(m.LL) && isFinite(m.PL))) galat.push('Isi batas cair dan batas plastis, atau pilih nonplastis.');
    if (F <= 35 && !(m.P40 >= 0)) galat.push('Tanah berbutir (lolos No. 200 ≤ 35%): isi persen lolos saringan No. 40.');
    if (F <= 15 && !(m.P10 >= 0)) galat.push('Untuk membedakan A-1-a: isi persen lolos saringan No. 10.');
    if (galat.length) return { galat: galat };

    var LL = isFinite(m.LL) ? Math.round(m.LL) : 0, IP = NP ? 0 : Math.round(m.LL - m.PL);
    var P10 = m.P10, P40 = m.P40, k;
    if (F <= 35) {
      if (P10 <= 50 && P40 <= 30 && F <= 15 && IP <= 6) k = 'A-1-a';
      else if (P40 <= 50 && F <= 25 && IP <= 6) k = 'A-1-b';
      else if (P40 > 50 && F <= 10 && NP) k = 'A-3';
      else k = 'A-2-' + (LL <= 40 ? (IP <= 10 ? 4 : 6) : (IP <= 10 ? 5 : 7));
    } else {
      if (LL <= 40) k = IP <= 10 ? 'A-4' : 'A-6';
      else if (IP <= 10) k = 'A-5';
      else k = IP <= LL - 30 ? 'A-7-5' : 'A-7-6';
    }
    var gi = indeksKelompok(k, F, LL, IP), induk = k.slice(0, 3);
    return { galat: [], peringatan: [], kelompok: k, GI: gi.GI, GImentah: gi.mentah, LL: LL, IP: IP, NP: NP, F: F,
      bahan: URAIAN_AASHTO[induk][0], nilaiTanahDasar: URAIAN_AASHTO[induk][1], granular: F <= 35 };
  }

  var api = { uscs: uscs, aashto: aashto, indeksKelompok: indeksKelompok, jenisHalus: jenisHalus };
  if (node) module.exports = api;
  else root.HitungKlasifikasi = api;
})(this);
