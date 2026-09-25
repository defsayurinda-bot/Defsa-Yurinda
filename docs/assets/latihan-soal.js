/*
 * Bank soal latihan geoteknik.
 *
 * Setiap templat membangkitkan soal dengan angka acak dari sebuah "kode soal" (seed),
 * lalu menghitung kunci jawabannya memakai modul kalkulator yang sudah diverifikasi
 * (pondasi-dangkal-hitung.js, konsolidasi-hitung.js, tiang-bor-hitung.js).
 * Tidak ada kunci jawaban yang ditulis tangan.
 *
 * templat.buat(rng, F) → { teks, tanya, jawaban, satuan, desimal, langkah(F) }
 *   F = { f(angka, desimal), t(angka, desimal) } untuk format teks dan TeX.
 */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var PD = node ? require('./pondasi-dangkal-hitung.js') : root.PondasiDangkal;
  var KO = node ? require('./konsolidasi-hitung.js') : root.Konsolidasi;
  var TB = node ? require('./tiang-bor-hitung.js') : root.TiangBor;

  var TOLERANSI = 0.02; // jawaban dianggap benar bila selisihnya ≤ 2%

  // Pembangkit acak berbasis seed (mulberry32) supaya soal bisa diulang dari kodenya.
  function rngDari(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function acak(rng, min, maks, langkah) {
    var n = Math.round((maks - min) / langkah);
    var v = min + Math.floor(rng() * (n + 1)) * langkah;
    return Math.round(v * 1000) / 1000;
  }
  function pilih(rng, daftar) { return daftar[Math.floor(rng() * daftar.length)]; }

  var TEMPLAT = [
    {
      id: 'faktor-daya-dukung', topik: 'pondasi-dangkal', judul: 'Faktor daya dukung',
      buat: function (rng, F) {
        var phi = acak(rng, 20, 38, 1);
        var jenis = pilih(rng, ['Nq', 'Nc', 'Ng']);
        var N = PD.faktorDayaDukung(phi);
        var nama = { Nq: 'N<sub>q</sub>', Nc: 'N<sub>c</sub>', Ng: 'N<sub>γ</sub>' }[jenis];
        return {
          teks: 'Tanah pasir berlanau mempunyai sudut geser dalam φ\' = ' + F.f(phi, 0) + '°.',
          tanya: 'Hitung faktor daya dukung ' + nama + ' (N<sub>q</sub> Reissner, N<sub>c</sub> Prandtl, N<sub>γ</sub> Vesic).',
          jawaban: N[jenis], satuan: '–', desimal: 2, data: { phi: phi, jenis: jenis },
          langkah: function (F) {
            var l = [{ judul: 'Hitung N<sub>q</sub>', tex: ['N_q = \\tan^2\\!\\left(45^\\circ + \\tfrac{' + F.t(phi, 0) + '^\\circ}{2}\\right) e^{\\pi \\tan ' + F.t(phi, 0) + '^\\circ} = ' + F.t(N.Nq, 3)] }];
            if (jenis === 'Nc') l.push({ judul: 'Hitung N<sub>c</sub>', tex: ['N_c = (N_q - 1)\\cot\\phi\' = (' + F.t(N.Nq, 3) + ' - 1)\\cot ' + F.t(phi, 0) + '^\\circ = ' + F.t(N.Nc, 3)] });
            if (jenis === 'Ng') l.push({ judul: 'Hitung N<sub>γ</sub>', tex: ['N_\\gamma = 2(N_q + 1)\\tan\\phi\' = 2(' + F.t(N.Nq, 3) + ' + 1)\\tan ' + F.t(phi, 0) + '^\\circ = ' + F.t(N.Ng, 3)] });
            return l;
          }
        };
      }
    },
    {
      id: 'lajur-lempung', topik: 'pondasi-dangkal', judul: 'Pondasi lajur di lempung (φ = 0)',
      buat: function (rng, F) {
        var B = acak(rng, 1.2, 2.5, 0.1), Df = acak(rng, 0.8, Math.min(2, B), 0.1);
        var c = acak(rng, 25, 80, 5), g = acak(rng, 16, 19, 0.5);
        var m = { bentuk: 'lajur', B: B, L: B, Df: Df, c: c, phi: 0, gamma: g, adaMAT: false, dw: 0, gammaSat: 19, FS: 3 };
        var r = PD.hitung(m);
        return {
          teks: 'Pondasi lajur selebar B = ' + F.f(B, 1) + ' m diletakkan pada kedalaman D<sub>f</sub> = ' + F.f(Df, 1) + ' m di lempung jenuh dengan c<sub>u</sub> = ' + F.f(c, 0) + ' kPa (φ = 0) dan γ = ' + F.f(g, 1) + ' kN/m³. Muka air tanah jauh di bawah.',
          tanya: 'Hitung kapasitas dukung ultimit q<sub>u</sub> dengan persamaan daya dukung umum (faktor kedalaman Hansen).',
          jawaban: r.qu, satuan: 'kPa', desimal: 1, data: m,
          langkah: function (F) {
            return [
              { judul: 'Faktor untuk φ = 0 dan pondasi lajur', teks: 'N<sub>c</sub> = 5,14; N<sub>q</sub> = 1; N<sub>γ</sub> = 0. Untuk lajur B/L = 0, sehingga semua faktor bentuk = 1.' },
              { judul: 'Faktor kedalaman', tex: ['F_{cd} = 1 + 0{,}4\\tfrac{D_f}{B} = 1 + 0{,}4\\times\\tfrac{' + F.t(Df, 1) + '}{' + F.t(B, 1) + '} = ' + F.t(r.D.Fcd, 3)] },
              { judul: 'Kapasitas dukung ultimit', tex: ['q_u = c_u N_c F_{cd} + \\gamma D_f = ' + F.t(c, 0) + '\\times 5{,}14\\times' + F.t(r.D.Fcd, 3) + ' + ' + F.t(g, 1) + '\\times' + F.t(Df, 1) + ' = ' + F.t(r.qu, 2) + '\\ \\text{kPa}'] }
            ];
          }
        };
      }
    },
    {
      id: 'bujur-sangkar-pasir', topik: 'pondasi-dangkal', judul: 'Pondasi bujur sangkar di pasir',
      buat: function (rng, F) {
        var B = acak(rng, 1.5, 3, 0.1), Df = acak(rng, 1, Math.min(1.5, B), 0.1);
        var phi = acak(rng, 28, 36, 1), g = acak(rng, 17, 19, 0.5);
        var m = { bentuk: 'persegi', B: B, L: B, Df: Df, c: 0, phi: phi, gamma: g, adaMAT: false, dw: 0, gammaSat: 19.5, FS: 3 };
        var r = PD.hitung(m);
        return {
          teks: 'Pondasi telapak bujur sangkar ' + F.f(B, 1) + ' × ' + F.f(B, 1) + ' m pada kedalaman ' + F.f(Df, 1) + ' m. Tanah pasir: c\' = 0, φ\' = ' + F.f(phi, 0) + '°, γ = ' + F.f(g, 1) + ' kN/m³. Muka air tanah jauh di bawah.',
          tanya: 'Hitung kapasitas dukung ultimit q<sub>u</sub> (N<sub>γ</sub> Vesic, faktor bentuk De Beer, faktor kedalaman Hansen).',
          jawaban: r.qu, satuan: 'kPa', desimal: 1, data: m,
          langkah: function (F) {
            return [
              { judul: 'Faktor daya dukung', tex: ['N_q = ' + F.t(r.N.Nq, 3) + '\\qquad N_\\gamma = ' + F.t(r.N.Ng, 3)] },
              { judul: 'Faktor bentuk (B/L = 1)', tex: ['F_{qs} = 1 + \\tan\\phi\' = ' + F.t(r.S.Fqs, 3) + '\\qquad F_{\\gamma s} = 1 - 0{,}4 = 0{,}6'] },
              { judul: 'Faktor kedalaman', tex: ['F_{qd} = 1 + 2\\tan\\phi\'(1-\\sin\\phi\')^2\\tfrac{D_f}{B} = ' + F.t(r.D.Fqd, 3) + '\\qquad F_{\\gamma d} = 1'] },
              { judul: 'Kapasitas dukung ultimit', tex: [
                'q = \\gamma D_f = ' + F.t(g, 1) + '\\times' + F.t(Df, 1) + ' = ' + F.t(r.A.q, 2) + '\\ \\text{kPa}',
                'q_u = q N_q F_{qs} F_{qd} + \\tfrac{1}{2}\\gamma B N_\\gamma F_{\\gamma s} F_{\\gamma d} = ' + F.t(r.suku2, 2) + ' + ' + F.t(r.suku3, 2) + ' = ' + F.t(r.qu, 2) + '\\ \\text{kPa}'] }
            ];
          }
        };
      }
    },
    {
      id: 'tekanan-mat', topik: 'pondasi-dangkal', judul: 'Tekanan efektif di dasar pondasi dengan MAT',
      buat: function (rng, F) {
        var Df = acak(rng, 1.2, 2.2, 0.1), dw = acak(rng, 0.3, Df - 0.2, 0.1);
        var g = acak(rng, 16.5, 18.5, 0.5), gs = acak(rng, 19, 21, 0.5);
        var m = { bentuk: 'persegi', B: 2, L: 2, Df: Df, c: 0, phi: 30, gamma: g, adaMAT: true, dw: dw, gammaSat: gs, FS: 3 };
        var r = PD.hitung(m);
        return {
          teks: 'Dasar pondasi berada ' + F.f(Df, 1) + ' m di bawah muka tanah. Muka air tanah ada pada kedalaman ' + F.f(dw, 1) + ' m. Tanah di atas MAT γ = ' + F.f(g, 1) + ' kN/m³, di bawah MAT γ<sub>sat</sub> = ' + F.f(gs, 1) + ' kN/m³ (γ<sub>w</sub> = 9,81 kN/m³).',
          tanya: 'Hitung tekanan efektif q di dasar pondasi yang dipakai pada suku N<sub>q</sub>.',
          jawaban: r.A.q, satuan: 'kPa', desimal: 2, data: m,
          langkah: function (F) {
            return [
              { judul: 'Berat volume efektif di bawah MAT', tex: ['\\gamma\' = \\gamma_{sat} - \\gamma_w = ' + F.t(gs, 1) + ' - 9{,}81 = ' + F.t(gs - 9.81, 2) + '\\ \\text{kN/m}^3'] },
              { judul: 'Tekanan efektif di dasar pondasi', tex: ['q = \\gamma d_w + \\gamma\'(D_f - d_w) = ' + F.t(g, 1) + '\\times' + F.t(dw, 1) + ' + ' + F.t(gs - 9.81, 2) + '\\times(' + F.t(Df, 1) + ' - ' + F.t(dw, 1) + ') = ' + F.t(r.A.q, 2) + '\\ \\text{kPa}'] }
            ];
          }
        };
      }
    },
    {
      id: 'penurunan-nc', topik: 'konsolidasi', judul: 'Penurunan lempung terkonsolidasi normal',
      buat: function (rng, F) {
        var m = { H: acak(rng, 2, 8, 0.5), e0: acak(rng, 0.8, 1.6, 0.05), Cc: acak(rng, 0.2, 0.6, 0.02), Cs: 0.05,
          s0: acak(rng, 40, 120, 5), modeDelta: 'manual', delta: acak(rng, 30, 150, 5), cv: 1, drainase: 'dua', t: 0 };
        m.sc = m.s0;
        var r = KO.hitung(m);
        return {
          teks: 'Lapisan lempung terkonsolidasi normal setebal ' + F.f(m.H, 1) + ' m mempunyai e<sub>0</sub> = ' + F.f(m.e0, 2) + ' dan C<sub>c</sub> = ' + F.f(m.Cc, 2) + '. Di tengah lapisan σ\'<sub>0</sub> = ' + F.f(m.s0, 0) + ' kPa, dan akibat beban baru tegangan bertambah Δσ\' = ' + F.f(m.delta, 0) + ' kPa.',
          tanya: 'Hitung penurunan konsolidasi primer S<sub>c</sub>.',
          jawaban: r.Sc * 1000, satuan: 'mm', desimal: 1, data: m,
          langkah: function (F) {
            return [{ judul: 'Rumus lempung NC', tex: [
              'S_c = \\dfrac{C_c H}{1 + e_0}\\log\\dfrac{\\sigma\'_0 + \\Delta\\sigma\'}{\\sigma\'_0} = \\dfrac{' + F.t(m.Cc, 2) + '\\times' + F.t(m.H, 1) + '}{1 + ' + F.t(m.e0, 2) + '}\\log\\dfrac{' + F.t(r.s1, 0) + '}{' + F.t(m.s0, 0) + '}',
              '= ' + F.t(r.Sc, 4) + '\\ \\text{m} = ' + F.t(r.Sc * 1000, 1) + '\\ \\text{mm}'] }];
          }
        };
      }
    },
    {
      id: 'penurunan-oc', topik: 'konsolidasi', judul: 'Penurunan lempung overkonsolidasi',
      buat: function (rng, F) {
        var s0 = acak(rng, 40, 100, 5), OCR = acak(rng, 1.5, 2.5, 0.1), sc = Math.round(s0 * OCR);
        var Cc = acak(rng, 0.25, 0.55, 0.01);
        var m = { H: acak(rng, 3, 8, 0.5), e0: acak(rng, 0.8, 1.4, 0.05), Cc: Cc, Cs: Math.round(Cc / acak(rng, 5, 10, 1) * 1000) / 1000,
          s0: s0, sc: sc, modeDelta: 'manual', delta: sc - s0 + acak(rng, 20, 120, 5), cv: 1, drainase: 'dua', t: 0 };
        var r = KO.hitung(m);
        return {
          teks: 'Lapisan lempung setebal ' + F.f(m.H, 1) + ' m: e<sub>0</sub> = ' + F.f(m.e0, 2) + ', C<sub>c</sub> = ' + F.f(m.Cc, 2) + ', C<sub>s</sub> = ' + F.f(m.Cs, 3) + '. Di tengah lapisan σ\'<sub>0</sub> = ' + F.f(s0, 0) + ' kPa dan tegangan prakonsolidasi σ\'<sub>c</sub> = ' + F.f(sc, 0) + ' kPa. Tambahan tegangan Δσ\' = ' + F.f(m.delta, 0) + ' kPa.',
          tanya: 'Hitung penurunan konsolidasi primer S<sub>c</sub>.',
          jawaban: r.Sc * 1000, satuan: 'mm', desimal: 1, data: m,
          langkah: function (F) {
            return [
              { judul: 'Periksa kondisi', teks: 'σ\'<sub>0</sub> + Δσ\' = ' + F.f(r.s1, 0) + ' kPa > σ\'<sub>c</sub> = ' + F.f(sc, 0) + ' kPa, jadi jalurnya melewati tegangan prakonsolidasi: rekompresi (C<sub>s</sub>) lalu kompresi murni (C<sub>c</sub>).' },
              { judul: 'Penurunan', tex: [
                'S_c = \\dfrac{C_s H}{1+e_0}\\log\\dfrac{\\sigma\'_c}{\\sigma\'_0} + \\dfrac{C_c H}{1+e_0}\\log\\dfrac{\\sigma\'_0+\\Delta\\sigma\'}{\\sigma\'_c}',
                '= ' + F.t(r.bagian.oc * 1000, 1) + ' + ' + F.t(r.bagian.nc * 1000, 1) + ' = ' + F.t(r.Sc * 1000, 1) + '\\ \\text{mm}'] }
            ];
          }
        };
      }
    },
    {
      id: 'waktu-t90', topik: 'konsolidasi', judul: 'Waktu konsolidasi 90%',
      buat: function (rng, F) {
        var m = { H: acak(rng, 2, 10, 0.5), e0: 1, Cc: 0.3, Cs: 0.05, s0: 50, sc: 50, modeDelta: 'manual', delta: 50,
          cv: acak(rng, 0.5, 4, 0.1), drainase: pilih(rng, ['dua', 'satu']), t: 0 };
        var r = KO.hitung(m);
        return {
          teks: 'Lapisan lempung setebal ' + F.f(m.H, 1) + ' m dengan c<sub>v</sub> = ' + F.f(m.cv, 1) + ' m²/tahun ' +
            (m.drainase === 'dua' ? 'diapit lapisan pasir di atas dan di bawahnya.' : 'berada di atas batuan kedap air, dengan lapisan pasir hanya di atasnya.'),
          tanya: 'Berapa lama waktu yang dibutuhkan untuk mencapai derajat konsolidasi 90%?',
          jawaban: r.t90, satuan: 'tahun', desimal: 2, data: m,
          langkah: function (F) {
            return [
              { judul: 'Panjang lintasan drainase', teks: 'Drainase ' + (m.drainase === 'dua' ? 'dua arah, H<sub>dr</sub> = H/2' : 'satu arah, H<sub>dr</sub> = H') + ' = ' + F.f(r.Hdr, 2) + ' m.' },
              { judul: 'Waktu', tex: ['t_{90} = \\dfrac{T_{v,90}\\,H_{dr}^2}{c_v} = \\dfrac{0{,}848\\times' + F.t(r.Hdr, 2) + '^2}{' + F.t(m.cv, 1) + '} = ' + F.t(r.t90, 2) + '\\ \\text{tahun}'] }
            ];
          }
        };
      }
    },
    {
      id: 'tegangan-21', topik: 'konsolidasi', judul: 'Tambahan tegangan metode 2:1',
      buat: function (rng, F) {
        var q = acak(rng, 100, 250, 10), B = acak(rng, 1.5, 3.5, 0.5), L = B + acak(rng, 0, 2, 0.5), z = acak(rng, 1, 8, 0.5);
        var m = { H: 2, e0: 1, Cc: 0.3, Cs: 0.05, s0: 50, sc: 50, modeDelta: '2:1', bentuk2: 'persegi', q: q, B2: B, L2: L, z: z, cv: 1, drainase: 'dua', t: 0 };
        var r = KO.hitung(m);
        return {
          teks: 'Pondasi ' + F.f(B, 1) + ' × ' + F.f(L, 1) + ' m menyalurkan tekanan q = ' + F.f(q, 0) + ' kPa ke tanah.',
          tanya: 'Dengan metode penyebaran 2:1, hitung tambahan tegangan Δσ pada kedalaman z = ' + F.f(z, 1) + ' m di bawah dasar pondasi.',
          jawaban: r.T.delta, satuan: 'kPa', desimal: 2, data: m,
          langkah: function (F) {
            return [{ judul: 'Metode 2:1', tex: ['\\Delta\\sigma = \\dfrac{q\\,B\\,L}{(B+z)(L+z)}', '= \\dfrac{' + F.t(q, 0) + '\\times' + F.t(B, 1) + '\\times' + F.t(L, 1) + '}{(' + F.t(B, 1) + '+' + F.t(z, 1) + ')(' + F.t(L, 1) + '+' + F.t(z, 1) + ')} = ' + F.t(r.T.delta, 2) + '\\ \\text{kPa}'] }];
          }
        };
      }
    },
    {
      id: 'rw-ujung', topik: 'tiang-bor', judul: 'Tahanan ujung tiang bor (Reese & Wright)',
      buat: function (rng, F) {
        var d = acak(rng, 0.4, 1.0, 0.1), L = acak(rng, 8, 20, 1), N = acak(rng, 15, 60, 1);
        var m = { d: d, L: L, SF: 2.5, gammaBeton: 24, pakaiBerat: false, perpindahan: 'kecil',
          lapisan: [{ atas: 0, bawah: L + 6, jenis: 'pasir', N: N, cu: null }] };
        var r = TB.hitung(m).reeseWright;
        return {
          teks: 'Tiang bor berdiameter ' + F.f(d, 1) + ' m tertanam ' + F.f(L, 0) + ' m di lapisan pasir. Nilai N-SPT di sekitar ujung tiang = ' + F.f(N, 0) + '.',
          tanya: 'Hitung tahanan ujung ultimit Q<sub>p</sub> dengan metode Reese &amp; Wright (1977).',
          jawaban: r.Qp, satuan: 'kN', desimal: 1, data: m,
          langkah: function (F) {
            return [
              { judul: 'Tahanan ujung satuan', tex: ['q_p = 7N = 7\\times' + F.t(N, 0) + ' = ' + F.t(7 * N, 0) + '\\ \\text{t/m}^2' + (r.ujung.dibatasi ? ' > 400 \\Rightarrow 400\\ \\text{t/m}^2' : ' \\le 400\\ \\text{t/m}^2'),
                'q_p = ' + F.t(r.ujung.qpT, 0) + '\\times 9{,}80665 = ' + F.t(r.qp, 2) + '\\ \\text{kPa}'] },
              { judul: 'Tahanan ujung', tex: ['A_p = \\tfrac{\\pi}{4}d^2 = ' + F.t(Math.PI * d * d / 4, 4) + '\\ \\text{m}^2\\qquad Q_p = q_p A_p = ' + F.t(r.Qp, 2) + '\\ \\text{kN}'] }
            ];
          }
        };
      }
    },
    {
      id: 'meyerhof-selimut', topik: 'tiang-bor', judul: 'Tahanan selimut tiang (Meyerhof)',
      // Tidak ditampilkan: pembagi 50/100 menurut perpindahan tiang belum bersumber (temuan B1–B3).
      disembunyikan: 'Menunggu rumus Meyerhof dicocokkan dengan PUPR (2019).',
      buat: function (rng, F) {
        var d = acak(rng, 0.4, 1.0, 0.1), L = acak(rng, 8, 20, 1), N = acak(rng, 10, 40, 1);
        var perpindahan = pilih(rng, ['kecil', 'besar']);
        var m = { d: d, L: L, SF: 2.5, gammaBeton: 24, pakaiBerat: false, perpindahan: perpindahan,
          lapisan: [{ atas: 0, bawah: L + 6, jenis: 'pasir', N: N, cu: null }] };
        var r = TB.hitung(m).meyerhof;
        return {
          teks: (perpindahan === 'kecil' ? 'Tiang bor' : 'Tiang pancang') + ' berdiameter ' + F.f(d, 1) + ' m tertanam ' + F.f(L, 0) + ' m di lapisan pasir homogen dengan N<sub>60</sub> rata-rata ' + F.f(N, 0) + '.',
          tanya: 'Hitung tahanan selimut ultimit Q<sub>s</sub> dengan korelasi SPT Meyerhof (1976), σ<sub>r</sub> = 100 kPa.',
          jawaban: r.Qs, satuan: 'kN', desimal: 1, data: m,
          langkah: function (F) {
            return [
              { judul: 'Gesekan selimut satuan', teks: 'Tiang ' + (perpindahan === 'kecil' ? 'bor termasuk perpindahan kecil, pembagi 100' : 'pancang termasuk perpindahan besar, pembagi 50') + '.',
                tex: ['f_s = \\dfrac{\\sigma_r N}{' + r.pembagi + '} = \\dfrac{100\\times' + F.t(N, 0) + '}{' + r.pembagi + '} = ' + F.t(100 * N / r.pembagi, 2) + '\\ \\text{kPa}'] },
              { judul: 'Tahanan selimut', tex: ['Q_s = f_s\\,\\pi d\\,L = ' + F.t(100 * N / r.pembagi, 2) + '\\times\\pi\\times' + F.t(d, 1) + '\\times' + F.t(L, 0) + ' = ' + F.t(r.Qs, 2) + '\\ \\text{kN}'] }
            ];
          }
        };
      }
    }
  ];

  var TOPIK = { 'pondasi-dangkal': 'Pondasi dangkal', konsolidasi: 'Konsolidasi', 'tiang-bor': 'Tiang bor' };

  function buatSoal(idTemplat, seed, F) {
    var tp = TEMPLAT.filter(function (x) { return x.id === idTemplat; })[0];
    if (!tp) return null;
    var s = tp.buat(rngDari(seed), F);
    s.id = tp.id; s.topik = tp.topik; s.judul = tp.judul; s.seed = seed;
    return s;
  }

  function periksaJawaban(jawaban, kunci) {
    if (!isFinite(jawaban)) return false;
    return Math.abs(jawaban - kunci) <= TOLERANSI * Math.abs(kunci);
  }

  var TEMPLAT_AKTIF = TEMPLAT.filter(function (x) { return !x.disembunyikan; });

  var api = { TEMPLAT: TEMPLAT, TEMPLAT_AKTIF: TEMPLAT_AKTIF, TOPIK: TOPIK, TOLERANSI: TOLERANSI, buatSoal: buatSoal, periksaJawaban: periksaJawaban, rngDari: rngDari };
  if (node) module.exports = api;
  else root.Latihan = api;
})(this);
