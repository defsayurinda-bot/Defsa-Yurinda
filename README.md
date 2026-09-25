# Defsa Yurinda · Situs dan alat geoteknik

[![Verifikasi](https://github.com/defsayurinda-bot/Defsa-Yurinda/actions/workflows/verifikasi.yml/badge.svg)](https://github.com/defsayurinda-bot/Defsa-Yurinda/actions/workflows/verifikasi.yml)

Kode dan tulisan untuk situs **[defsayurinda-bot.github.io/Defsa-Yurinda](https://defsayurinda-bot.github.io/Defsa-Yurinda/)**: kalkulator geoteknik dengan langkah hitungan lengkap, latihan soal, dan catatan belajar memakai Claude Code.

Untuk **memakai** alatnya, buka situsnya. README ini untuk yang ingin melihat atau mengubah isinya.

## Isi situs

| Bagian | Tautan |
|---|---|
| Alat | [Semua kalkulator](https://defsayurinda-bot.github.io/Defsa-Yurinda/alat/) · [Praktikum Mekanika Tanah](https://defsayurinda-bot.github.io/Defsa-Yurinda/praktikum/) · [Latihan soal](https://defsayurinda-bot.github.io/Defsa-Yurinda/latihan/) |
| Tulisan | [Catatan belajar](https://defsayurinda-bot.github.io/Defsa-Yurinda/catatan/) · [Cara saya memakai AI](https://defsayurinda-bot.github.io/Defsa-Yurinda/cara-memakai-ai/) · [Skill Claude](https://defsayurinda-bot.github.io/Defsa-Yurinda/skill/) |
| Profil | [Tentang saya](https://defsayurinda-bot.github.io/Defsa-Yurinda/tentang/) |

## Struktur repo

```
konten/     tulisan sumber (Markdown) dan daftar alat praktikum (praktikum.json)
docs/       situs yang diterbitkan GitHub Pages
  kalkulator/, latihan/, alat/     halaman alat (ditulis tangan)
  assets/*-hitung.js               rumus, dipisah dari tampilan supaya bisa diuji
  assets/praktikum/                kerangka, grafik, rumus, dan definisi alat praktikum
  praktikum/                       halaman praktikum (dibangun dari konten/praktikum.json)
  tentang/, catatan/, ...          halaman hasil bangun dari konten/ (jangan diedit langsung)
skrip/      bangun_situs.py: ubah konten/ jadi halaman, seragamkan menu dan footer
tests/      verifikasi hitungan, bank soal, dan tautan
```

## Mengubah isi

- **Tulisan:** edit berkas di `konten/`, lalu jalankan `python3 skrip/bangun_situs.py` (butuh `pip install -r skrip/kebutuhan.txt`).
- **Kalkulator:** rumus ada di `docs/assets/*-hitung.js`. Setiap perubahan rumus harus lolos semua `tests/verifikasi_*.py`, dan rumus baru wajib punya kasus uji.
- **Alat praktikum baru:** lihat bagian *Menambah alat praktikum* di [CLAUDE.md](CLAUDE.md). Singkatnya: satu berkas rumus, satu definisi alat, satu entri di `konten/praktikum.json`, dan kasus uji.
- **Pemeriksaan otomatis:** setiap push dan Pull Request menjalankan semua pengujian dan memeriksa bahwa `docs/` sudah dibangun ulang dari `konten/`.

Aturan lengkap untuk Claude Code ada di [CLAUDE.md](CLAUDE.md).

## Lisensi

[CC BY 4.0](LICENSE). Boleh dipakai, disalin, dan diubah, termasuk untuk keperluan komersial, asal mencantumkan nama Defsa Yurinda dan tautan ke repo ini.
