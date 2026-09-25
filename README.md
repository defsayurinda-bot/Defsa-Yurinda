# Defsa Yurinda · Situs dan alat geoteknik

[![Verifikasi](https://github.com/defsayurinda/defsayurinda.github.io/actions/workflows/verifikasi.yml/badge.svg)](https://github.com/defsayurinda/defsayurinda.github.io/actions/workflows/verifikasi.yml)

**Bahasa Indonesia** · [English](README.en.md)

Kode dan tulisan untuk situs **[defsayurinda.github.io](https://defsayurinda.github.io/)**: kalkulator geoteknik dengan langkah hitungan lengkap, latihan soal, dan catatan belajar memakai Claude Code.

Untuk **memakai** alatnya, buka situsnya. README ini untuk yang ingin melihat atau mengubah isinya.

## Isi situs

| Bagian | Tautan |
|---|---|
| Alat | [Semua kalkulator](https://defsayurinda.github.io/alat/) · [Praktikum Mekanika Tanah](https://defsayurinda.github.io/praktikum/) · [Latihan soal](https://defsayurinda.github.io/latihan/) |
| Tulisan | [Catatan belajar](https://defsayurinda.github.io/catatan/) · [Cara saya memakai AI](https://defsayurinda.github.io/cara-memakai-ai/) · [Skill Claude](https://defsayurinda.github.io/skill/) |
| Profil | [Tentang saya](https://defsayurinda.github.io/tentang/) |

## Alat

Tabel ini dibangun otomatis dari [`konten/alat.json`](konten/alat.json).

<!-- ALAT:MULAI -->
| Alat | Isi | Status sumber |
|---|---|---|
| [Kalkulator Tiang Bor N-SPT](https://defsayurinda.github.io/kalkulator/tiang-bor.html) | Hitung daya dukung aksial tiang bor dari data N-SPT dengan metode Reese & Wright (1977), lengkap dengan langkah hitungan dan asumsinya. | Sumber sekunder |
| [Kalkulator Pondasi Dangkal](https://defsayurinda.github.io/kalkulator/pondasi-dangkal.html) | Hitung kapasitas dukung pondasi dangkal dengan persamaan daya dukung umum: faktor bentuk, kedalaman, dan koreksi muka air tanah, lengkap dengan langkah hitungan. | Belum terverifikasi |
| [Kalkulator Penurunan Konsolidasi](https://defsayurinda.github.io/kalkulator/konsolidasi.html) | Hitung penurunan konsolidasi primer satu dimensi untuk lempung NC dan OC beserta lajunya terhadap waktu, lengkap dengan diagram e–log σ' dan langkah hitungan. | Belum terverifikasi |
| [Praktikum Mekanika Tanah](https://defsayurinda.github.io/praktikum/) | 16 alat pengolah data praktikum Mekanika Tanah: formulir seperti lembar data laboratorium, langkah hitungan, grafik, dan ekspor ke Word dan Excel. | Belum terverifikasi |
| [Latihan Soal Geoteknik](https://defsayurinda.github.io/latihan/) | Latihan soal geoteknik dengan angka acak dan pembahasan langkah demi langkah: pondasi dangkal, konsolidasi, dan tiang bor. | Belum terverifikasi |
<!-- ALAT:SELESAI -->

## Struktur repo

```
konten/     tulisan sumber (Markdown), registri alat (alat.json), daftar alat praktikum (praktikum.json)
docs/       situs yang diterbitkan GitHub Pages
  kalkulator/, latihan/, alat/     halaman alat (ditulis tangan)
  assets/*-hitung.js               rumus, dipisah dari tampilan supaya bisa diuji
  assets/praktikum/                kerangka, grafik, rumus, dan definisi alat praktikum
  praktikum/                       halaman praktikum (dibangun dari konten/praktikum.json)
  tentang/, catatan/, ...          halaman hasil bangun dari konten/ (jangan diedit langsung)
skrip/      bangun_situs.py: ubah konten/ jadi halaman; buat.py: kerangka alat atau catatan baru
tests/      verifikasi hitungan, bank soal, dan tautan
```

## Mengubah isi

- **Panduan singkat:** [PANDUAN.md](PANDUAN.md).
- **Tulisan:** edit berkas di `konten/`, lalu jalankan `python3 skrip/bangun_situs.py` (butuh `pip install -r skrip/kebutuhan.txt`).
- **Kalkulator:** rumus ada di `docs/assets/*-hitung.js`. Setiap perubahan rumus harus lolos semua `tests/verifikasi_*.py`, dan rumus baru wajib punya kasus uji.
- **Alat praktikum baru:** lihat bagian *Menambah alat praktikum* di [CLAUDE.md](CLAUDE.md). Singkatnya: satu berkas rumus, satu definisi alat, satu entri di `konten/praktikum.json`, dan kasus uji.
- **Pemeriksaan otomatis:** setiap push dan Pull Request menjalankan semua pengujian dan memeriksa bahwa `docs/` sudah dibangun ulang dari `konten/`.

Aturan lengkap untuk Claude Code ada di [CLAUDE.md](CLAUDE.md).

## Lisensi

- **Kode** (JavaScript, Python, CSS, kerangka HTML, workflow): [MIT](LICENSE).
- **Tulisan dan gambar** (isi `konten/`, teks halaman situs, tangkapan layar): [CC BY 4.0](LICENSE-TULISAN).

Keduanya boleh dipakai, disalin, dan diubah, termasuk untuk keperluan komersial, asal mencantumkan nama Defsa Yurinda dan tautan ke repo ini.
