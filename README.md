# Defsa Yurinda

[![Verifikasi hitungan](https://github.com/defsayurinda-bot/Defsa-Yurinda/actions/workflows/verifikasi.yml/badge.svg)](https://github.com/defsayurinda-bot/Defsa-Yurinda/actions/workflows/verifikasi.yml)

Mahasiswa Teknik Sipil, Universitas Jambi. Minat utama: geoteknik.

Repo ini berisi catatan saya selama belajar dan memakai Claude dan Claude Code untuk kuliah: bagaimana saya mengatur Claude, perintah yang saya pakai, aturan yang saya pegang supaya hasilnya bisa dipertanggungjawabkan, dan skill yang saya susun sendiri.

## Situs

**[defsayurinda-bot.github.io/Defsa-Yurinda](https://defsayurinda-bot.github.io/Defsa-Yurinda/)**

| Alat | Keterangan |
|---|---|
| [Kalkulator tiang bor N-SPT](https://defsayurinda-bot.github.io/Defsa-Yurinda/kalkulator/tiang-bor.html) | Daya dukung aksial dengan metode Reese & Wright (1977) dan Meyerhof (1976), lengkap dengan langkah hitungan, profil tanah, dan tautan berbagi |
| [Kalkulator pondasi dangkal](https://defsayurinda-bot.github.io/Defsa-Yurinda/kalkulator/pondasi-dangkal.html) | Persamaan daya dukung umum dengan faktor bentuk (De Beer), kedalaman (Hansen), N<sub>γ</sub> Vesic, dan koreksi muka air tanah |
| [Latihan soal](https://defsayurinda-bot.github.io/Defsa-Yurinda/latihan/) | 10 jenis soal pondasi dangkal, konsolidasi, dan tiang bor dengan angka acak, pemeriksaan otomatis, pembahasan, dan skor |
| [Kalkulator penurunan konsolidasi](https://defsayurinda-bot.github.io/Defsa-Yurinda/kalkulator/konsolidasi.html) | Lempung NC/OC, Δσ metode 2:1, diagram e–log σ', dan kurva penurunan terhadap waktu |

Kode hitungan diuji otomatis setiap kali ada perubahan ([`tests/`](tests/)): dibandingkan dengan perhitungan Python yang ditulis terpisah dan dengan nilai tabel buku teks.

## Mulai dari mana

| Kalau kamu ingin... | Baca |
|---|---|
| Tahu siapa saya | [Tentang saya](tentang-saya.md) |
| Tahu apa itu Claude dan Claude Code | [Catatan 01](catatan/01-mengenal-claude-dan-claude-code.md) |
| Melihat cara saya mengatur Claude | [Preferensi](cara-saya-memakai-claude/preferensi.md) |
| Mencontoh perintah untuk tugas teknik sipil | [Contoh prompt](cara-saya-memakai-claude/contoh-prompt.md) |
| Tahu batasan yang saya pakai | [Batasan dan etika](cara-saya-memakai-claude/batasan-dan-etika.md) |
| Melihat skill Claude yang saya buat | [Skill](skill/) |

## Isi repo

```
.
├── docs/                         situs (GitHub Pages): beranda dan kalkulator
├── tests/                        verifikasi hitungan kalkulator
├── tentang-saya.md               profil, pendidikan, pengalaman
├── catatan/                      jurnal belajar, bernomor urut
├── cara-saya-memakai-claude/     preferensi, contoh prompt, batasan
└── skill/                        skill Claude yang saya pakai
```

`CLAUDE.md` berisi aturan untuk Claude saat mengubah repo ini.

## Catatan belajar

| No | Topik |
|---|---|
| 01 | [Mengenal Claude dan Claude Code](catatan/01-mengenal-claude-dan-claude-code.md) |
| 02 | [Git dan Pull Request pertama](catatan/02-git-dan-pull-request-pertama.md) |
| 03 | [Membangun situs dan kalkulator bersama Claude Code](catatan/03-membangun-situs-dan-kalkulator.md) |

Catatan baru ditambahkan seiring saya belajar.

## Soal isi repo ini

Tulisan di sini disusun bersama Claude, lalu saya periksa. Repo ini bukan panduan resmi Anthropic. Fitur Claude berubah cukup cepat, jadi catatan yang lebih lama bisa saja sudah tidak sesuai.

## Lisensi

Isi repo ini dilisensikan dengan [Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE). Boleh disalin, diubah, dan dipakai ulang, termasuk untuk keperluan komersial, asal mencantumkan nama saya dan link ke repo ini.
