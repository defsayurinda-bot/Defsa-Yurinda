/*
 * Fungsi dasar untuk semua alat praktikum: kadar air dari cawan, rata-rata,
 * regresi linier, dan regresi polinomial. Tanpa tampilan supaya bisa diuji.
 */
(function (root) {
  'use strict';

  // Kadar air dari tiga penimbangan cawan (gram): basah+cawan, kering+cawan, cawan.
  function kadarAir(W1, W2, W3) {
    var air = W1 - W2, kering = W2 - W3;
    return { air: air, kering: kering, w: air / kering * 100 };
  }

  function rata(daftar) {
    return daftar.reduce(function (a, b) { return a + b; }, 0) / daftar.length;
  }

  // y = a + b·x dengan kuadrat terkecil; juga mengembalikan R².
  function regresiLinier(x, y) {
    var n = x.length, mx = rata(x), my = rata(y), sxy = 0, sxx = 0, syy = 0;
    for (var i = 0; i < n; i++) {
      sxy += (x[i] - mx) * (y[i] - my);
      sxx += (x[i] - mx) * (x[i] - mx);
      syy += (y[i] - my) * (y[i] - my);
    }
    var b = sxy / sxx, a = my - b * mx;
    return { a: a, b: b, r2: syy > 0 ? (sxy * sxy) / (sxx * syy) : 1 };
  }

  // Selesaikan sistem linier kecil dengan eliminasi Gauss berpivot.
  function selesaikan(A, v) {
    var n = v.length, M = A.map(function (baris, i) { return baris.concat([v[i]]); });
    for (var k = 0; k < n; k++) {
      var p = k;
      for (var i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      var t = M[k]; M[k] = M[p]; M[p] = t;
      for (var i2 = k + 1; i2 < n; i2++) {
        var f = M[i2][k] / M[k][k];
        for (var j = k; j <= n; j++) M[i2][j] -= f * M[k][j];
      }
    }
    var x = new Array(n);
    for (var r = n - 1; r >= 0; r--) {
      var s = M[r][n];
      for (var c = r + 1; c < n; c++) s -= M[r][c] * x[c];
      x[r] = s / M[r][r];
    }
    return x;
  }

  // Polinomial orde k dengan kuadrat terkecil. x dipusatkan supaya stabil secara numerik.
  // Mengembalikan fungsi f(x) dan koefisien dalam bentuk x asli: y = c0 + c1·x + … + ck·x^k.
  function regresiPolinomial(x, y, orde) {
    var m = rata(x), s = Math.max.apply(null, x.map(function (v) { return Math.abs(v - m); })) || 1;
    var u = x.map(function (v) { return (v - m) / s; });
    var A = [], v = [];
    for (var i = 0; i <= orde; i++) {
      A.push([]);
      for (var j = 0; j <= orde; j++) {
        A[i].push(u.reduce(function (acc, ui) { return acc + Math.pow(ui, i + j); }, 0));
      }
      v.push(u.reduce(function (acc, ui, k) { return acc + y[k] * Math.pow(ui, i); }, 0));
    }
    var d = selesaikan(A, v); // koefisien dalam u
    function f(xx) {
      var uu = (xx - m) / s, hasil = 0;
      for (var k = orde; k >= 0; k--) hasil = hasil * uu + d[k];
      return hasil;
    }
    // Ubah ke koefisien x asli: y = Σ d_k ((x − m)/s)^k.
    var c = new Array(orde + 1).fill(0);
    for (var k = 0; k <= orde; k++) {
      for (var j2 = 0; j2 <= k; j2++) {
        c[j2] += d[k] * binom(k, j2) * Math.pow(-m, k - j2) / Math.pow(s, k);
      }
    }
    var ym = rata(y), ssr = 0, sst = 0;
    y.forEach(function (yi, k) { ssr += Math.pow(yi - f(x[k]), 2); sst += Math.pow(yi - ym, 2); });
    return { f: f, koef: c, r2: sst > 0 ? 1 - ssr / sst : 1 };
  }

  function binom(n, k) {
    var r = 1;
    for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return r;
  }

  var api = { kadarAir: kadarAir, rata: rata, regresiLinier: regresiLinier, regresiPolinomial: regresiPolinomial };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HitungDasar = api;
})(this);
