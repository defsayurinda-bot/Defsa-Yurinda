---
name: tambah-alat
description: Tambah kalkulator atau alat hitung baru ke situs Defsa (registri konten/alat.json, buat.py, rumus bersumber, uji, tangkapan layar, PR). Pakai saat Defsa minta alat baru atau mengerjakan butir backlog alat.
---

# /tambah-alat

Ikuti CLAUDE.md dan `.claude/rencana.md`. Alat baru hanya dikerjakan bila Aturan wajib 3 mengizinkan (semua temuan Fatal sudah beres).

1. **Sumber dulu.** Tanyakan atau periksa sumber rumus sesuai Aturan Sumber (judul, edisi, halaman). Kalau halaman sumbernya tidak ada di sesi, berhenti dan minta Defsa mengirimnya. Jangan menulis rumus dari ingatan.
2. **Kerangka.** Jalankan:
   `python3 skrip/buat.py alat <id> --judul "<judul>" --kategori <kategori> --sumber "<penulis (tahun), judul, halaman>"`
   Kategori yang ada tercantum di `konten/alat.json`.
3. **Rumus.** Tulis rumus di `docs/assets/<id>-hitung.js` (pola UMD, tanpa DOM). Setiap rumus diberi nomor persamaan dan halaman sumber di komentar. Nilai yang belum bisa diverifikasi ditandai `[BELUM TERVERIFIKASI]`.
4. **Tampilan.** Formulir dan langkah hitungan di `docs/assets/<id>-tampilan.js` dengan urutan diketahui, ditanya, penyelesaian, hasil, catatan. Teks dari pengguna atau tautan lewat `esc()`/`textContent`. Baca tautan berbagi dengan `U.bacaHash(cek)` yang memanggil `U.tanpaHTML`.
5. **Uji.** Isi `tests/verifikasi_<id>.py`: satu contoh soal buku utuh (judul, edisi, halaman, penanda `CONTOH-BUKU`) dan minimal satu uji sifat. Uji yang hanya menyalin rumus JS ke Python belum cukup.
6. **Registri.** Lengkapi `rincian`, `ringkas`, `deskripsi`, dan `status` di `konten/alat.json`. Status `asli` hanya bila uji contoh soal buku sudah ada.
7. **Periksa.** `python3 skrip/bangun_situs.py`, `--periksa`, dan semua `tests/verifikasi_*.py`. Tangkapan layar 390 px dan 1280 px, terang dan gelap, tanpa gulir horizontal dan tanpa `.katex-error`.
8. **PR.** Branch baru dari `main`, commit, PR dengan tabel bukti. Merge sesuai Aturan wajib 2 setelah CI hijau.
