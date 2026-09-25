---
name: audit-rumus
description: Periksa rumus, koefisien, nilai tabel, dan sumber di kalkulator atau alat praktikum situs Defsa, lalu laporkan temuan Fatal / Perlu cek / Kosmetik. Hanya memeriksa, tidak mengubah kode.
---

# /audit-rumus

Hanya membaca dan melapor. Jangan mengubah berkas.

1. Tentukan cakupan: satu alat, satu kelompok, atau semua (lihat `konten/alat.json`).
2. Untuk setiap rumus di `docs/assets/*-hitung.js` dan `docs/assets/praktikum/hitung-*.js`, cocokkan dengan sumber yang tersedia di sesi menurut Aturan Sumber: rumus, satuan, batas berlaku, koefisien, dan halaman.
3. Cek halaman alat: sumber tercantum, asumsi ditulis, penanda `[BELUM TERVERIFIKASI]` ada di tempat yang perlu.
4. Cek uji: ada contoh soal buku? ada uji sifat? atau hanya salinan rumus JS ke Python?
5. Laporkan tabel `Kode | Tingkat | Temuan | Bukti (berkas:baris, halaman sumber) | Usulan`. Tingkat: F (Fatal: hasil salah atau rumus di luar batas berlaku), P (Perlu cek: sumber kurang, asumsi tidak ditulis), K (Kosmetik).
6. Temuan yang tidak bisa diputuskan tanpa sumber ditulis "perlu halaman sumber" beserta sumber yang dibutuhkan.
