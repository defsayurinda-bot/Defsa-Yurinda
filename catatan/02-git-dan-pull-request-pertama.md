# 02 — Git dan Pull Request pertama

*Ditulis September 2026, dari sesi pertama saya merapikan akun GitHub bersama Claude Code.*

## Istilah dasar

| Istilah | Arti |
|---|---|
| **Repository (repo)** | Folder proyek yang setiap perubahannya dicatat. |
| **Commit** | Satu catatan perubahan: file apa yang berubah, oleh siapa, kapan, dan pesannya. |
| **Branch** | Jalur kerja terpisah. `main` adalah jalur utama; perubahan dicoba di branch lain dulu. |
| **Push** | Mengirim commit ke GitHub. |
| **Pull Request (PR)** | Permintaan menggabungkan branch ke `main`. Di sini perubahan diperiksa sebelum diterima. |
| **Merge** | Menggabungkan branch ke `main`. |
| **Issue** | Catatan tugas atau masalah di GitHub. Bisa diberi label dan ditutup kalau selesai. |

## Alurnya

```
main ──●──────────────────────●──   (merge)
        \                    /
branch   ●── commit ── push ── PR
```

## Yang terjadi di sesi pertama

1. Repo pribadi saya awalnya hanya berisi `README.md` satu baris.
2. Claude membuat branch, menulis `CLAUDE.md` (profil dan aturan kerja saya), lalu commit dan push.
3. Saya membuat Pull Request pertama, membaca perubahannya di tab **Files changed**, lalu klik **Merge**.
4. Untuk pekerjaan berikutnya, Claude memulai branch baru dari `main` terbaru. PR yang sudah di-merge tidak dipakai lagi.
5. Setelah paham alurnya, saya memutuskan Claude boleh melakukan merge sendiri. Saya tetap bisa memeriksa belakangan lewat riwayat commit, dan kesalahan bisa dibatalkan dengan `git revert`.
6. Tugas yang belum selesai dicatat di **Issues** dengan label (`repo`, `belajar`, `kuliah`, `skripsi`). Issues juga berfungsi sebagai ingatan untuk sesi Claude berikutnya.

## Yang saya pelajari

- **Branch dan PR membuat kesalahan murah.** Kalau hasil kerja Claude salah, PR cukup ditutup tanpa merge. `main` tidak berubah.
- **Claude tidak bisa melakukan semuanya.** Pengaturan akun (username, foto, 2FA) dan membuat repo baru harus saya kerjakan sendiri di web GitHub. Aplikasi Claude di GitHub hanya diberi akses ke repo tertentu.
- **Repo publik perlu disaring.** NIM, data proyek, dan draf skripsi tidak masuk ke repo publik. Draf skripsi yang sudah terbit online bisa terdeteksi sebagai kemiripan oleh pemeriksa plagiarisme.

## Latihan

Buat PR tanpa Claude, langsung dari web GitHub:

1. Buka sebuah file di repo milikmu, lalu klik ikon pensil.
2. Ubah satu kalimat.
3. Klik **Commit changes...**, pilih **Create a new branch for this commit and start a pull request**.
4. Buat PR-nya, periksa **Files changed**, lalu merge.

Pertanyaan: kalau di langkah 4 kamu klik **Close pull request** alih-alih merge, apa yang terjadi pada file di `main`?
