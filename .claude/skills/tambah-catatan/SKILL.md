---
name: tambah-catatan
description: Tambah catatan belajar bernomor ke konten/catatan situs Defsa. Pakai saat Defsa minta menulis catatan baru.
---

# /tambah-catatan

1. Tanyakan pengalaman Defsa yang mau dijadikan contoh. Jangan mengarang pengalaman, pencapaian, atau data.
2. Jalankan `python3 skrip/buat.py catatan "<judul>"`. Berkas `konten/catatan/NN-<judul>.md` dibuat dengan nomor berikutnya dan bulan penulisan.
3. Isi dengan urutan: konsep, contoh dari pengalaman Defsa, latihan. Fakta tentang fitur Claude hanya ditulis setelah dicek di dokumentasi resmi.
4. Tulisan mengikuti "Aturan tulisan dan tampilan" di rencana: santai tapi rapi, tanpa pola tulisan AI. Periksa privasi (Aturan wajib 6).
5. Tautan ke tulisan lain memakai jalur relatif ke berkas `.md`.
6. Jalankan `python3 skrip/bangun_situs.py` dan semua uji, lalu PR dan merge sesuai Aturan wajib 2.
