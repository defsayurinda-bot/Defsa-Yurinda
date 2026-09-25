---
name: tambah-soal
description: Tambah templat soal ke bank soal latihan geoteknik (docs/assets/latihan-soal.js) dengan kunci dari modul hitung dan uji di tests/verifikasi_latihan.py.
---

# /tambah-soal

1. Soal hanya untuk rumus yang sudah ada di modul `docs/assets/*-hitung.js` dan bersumber. Rumus baru lewat /tambah-alat dulu.
2. Tambah objek templat di `TEMPLAT` pada `docs/assets/latihan-soal.js`: `id`, `topik`, `judul`, dan `buat(rng, F)` yang mengembalikan `teks`, `tanya`, `jawaban`, `satuan`, `desimal`, `data`, dan `langkah`.
3. Kunci jawaban selalu dihitung modul `*-hitung.js`, tidak ditulis ulang di templat. Rentang angka acak harus menghasilkan soal yang wajar.
4. Tambah cabang `kunci_python` untuk id baru di `tests/verifikasi_latihan.py` (hitungan Python terpisah, dengan sumber di komentar).
5. Perbarui jumlah jenis soal di `konten/alat.json` (entri `latihan`), jalankan `python3 skrip/bangun_situs.py` dan semua uji.
6. Cek pembahasan di browser (390 px dan 1280 px), lalu PR dan merge sesuai Aturan wajib 2.
