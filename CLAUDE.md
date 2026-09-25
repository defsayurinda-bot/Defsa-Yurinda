# CLAUDE.md

Panduan untuk Claude saat bekerja di repo ini. Rencana kerja per tahap, keputusan Defsa, Aturan Sumber, dan temuan audit ada di [`.claude/rencana.md`](.claude/rencana.md). Baca berkas itu sebelum mulai.

## Aturan wajib

1. **Identitas git** wajib `Defsa Yurinda <310235006+defsayurinda@users.noreply.github.com>` (akun berganti nama dari `-bot` di Tahap 1, September 2026). Cek `git config user.email` sebelum setiap commit. Email `187654321+defsa-yurinda@users.noreply.github.com` SALAH: ID itu milik akun GitHub orang lain. Lingkungan cloud pernah menyetel `GIT_AUTHOR_EMAIL` dan `GIT_COMMITTER_EMAIL` ke email salah itu, dan variabel lingkungan mengalahkan `git config`; periksa juga `env | grep ^GIT_`. Blok `env` di `.claude/settings.json` menimpanya.
2. **Jangan pernah me-merge PR dan jangan push langsung ke `main`.** Defsa yang me-merge di GitHub setelah memeriksa. Satu-satunya pengecualian: force push penulisan ulang riwayat di Tahap 1 setelah Defsa mengizinkan.
3. **Kerjakan hanya tahap yang diminta.** Jangan menambah fitur, halaman, alat, atau refactor di luar daftar tugas tahap itu. Fitur baru baru dikerjakan setelah semua temuan Fatal beres (diperbaiki sesuai sumber, atau bagian yang terdampak disembunyikan).
4. **Sumber.** Jangan menulis rumus, koefisien, nilai tabel, nomor standar, atau pustaka tanpa sumber yang memenuhi Aturan Sumber di rencana. Kalau sumber yang memenuhi tidak ada di sesi, berhenti dan minta Defsa mengirim halamannya. Jangan mencari pengganti dari situs yang dilarang.
5. **Berhenti dan tanya Defsa** sebelum: force push; menghapus berkas atau branch; mengganti nama repo atau berkas secara massal; mengubah pengaturan repo atau akun; memilih di antara dua cara yang sama-sama valid dan memengaruhi arsitektur; mengerjakan apa pun di luar tahap; atau setelah dua kali gagal memperbaiki galat yang sama.
6. **Privasi.** Jangan memuat NIM, nomor HP, alamat, email pribadi, data atau nama asli proyek, nama dosen, draf skripsi, atau detail lomba ke repo publik. Repo privat `catatan-pribadi` tidak disentuh kecuali disebut di tugas.
7. **Satu branch per tahap** dengan nama jelas, misalnya `tahap-2/hitungan`. Pakai subagent hanya untuk penelusuran besar yang benar-benar terpisah.
8. **Bukti.** Setiap klaim "selesai" dibuktikan dengan keluaran perintah (uji, `python3 skrip/bangun_situs.py --periksa`) dan, untuk tampilan, tangkapan layar.

## Format laporan tahap

Bahasa Indonesia, singkat, tanpa basa-basi:
1. Tabel "Yang dikerjakan | Bukti (perintah dan hasil) | Berkas".
2. Tabel khusus bila tahap memintanya.
3. Daftar hal yang menunggu Defsa.
4. Tautan PR dan Issue.

Setelah laporan, berhenti dan tunggu Defsa.

## Tentang repo

Repo **publik** milik Defsa Yurinda (mahasiswa Teknik Sipil, Universitas Jambi). Isinya situs GitHub Pages yang menjadi pintu utama semua isi publik Defsa: kalkulator geoteknik, alat praktikum, latihan soal, catatan belajar, cara memakai AI, skill, dan profil. Lisensi sekarang CC BY 4.0; pemisahan MIT (kode) dan CC BY 4.0 (tulisan) dikerjakan di Tahap 5.

## Aturan isi

- Semua orang bisa membaca repo ini. Lihat Aturan wajib 6.
- Jangan mengarang pengalaman, pencapaian, atau data tentang Defsa. Kalau informasinya belum ada, tanyakan.
- Fakta tentang fitur Claude hanya ditulis setelah dicek di dokumentasi resmi. Tulis bulan penulisan di setiap catatan.
- Teks situs mengikuti "Aturan tulisan dan tampilan" di rencana: santai tapi rapi, tanpa pola tulisan dan ciri template AI.
- Jangan memuat nama mahasiswa, asisten, atau dosen dari berkas panduan atau form lab.

## Struktur

| Lokasi | Isi |
|---|---|
| `konten/` | Sumber tulisan (`tentang.md`, `catatan/`, `cara-memakai-ai/`, `skill/`) dan daftar alat praktikum (`praktikum.json`) |
| `docs/` | Situs. Halaman kalkulator ditulis tangan; halaman tulisan dan praktikum dibangun dari `konten/` |
| `skrip/bangun_situs.py` | Membangun halaman dari `konten/`, menyeragamkan menu dan footer (penanda `NAV`/`FOOTER`), daftar catatan di beranda (penanda `CATATAN`), sitemap. `--periksa` dipakai CI |
| `tests/` | Verifikasi hitungan, bank soal, dan tautan |
| `.claude/` | Rencana kerja dan pengaturan Claude Code |

- Profil Defsa hanya ditulis di `konten/tentang.md`. Beranda dan README profil GitHub hanya menautkan.
- Jangan mengedit halaman hasil bangun atau teks di antara penanda; edit sumbernya lalu jalankan `python3 skrip/bangun_situs.py`.
- Catatan baru masuk `konten/catatan/` dengan nomor urut berikutnya, baris pertama `# NN — Judul`, urutan isi: konsep, contoh dari pengalaman Defsa, latihan.
- Tautan antartulisan memakai jalur relatif ke berkas `.md`; skrip mengubahnya menjadi tautan situs.
- Nama file huruf kecil, dipisah tanda hubung.

## Situs dan hitungan

- Situs di `docs/` (HTML, CSS, JavaScript biasa), terbit lewat GitHub Pages dari `main`, folder `/docs`. CI gagal bila `docs/` belum dibangun ulang dari `konten/`.
- Hitungan dipisah dari tampilan: `docs/assets/*-hitung.js` dan `docs/assets/praktikum/hitung-*.js` hanya berisi rumus (pola UMD, bisa di-`require` di Node); berkas tampilan berisi formulir dan langkah hitungan.
- Setiap rumus harus punya sumber sesuai Aturan Sumber dan ditulis di halaman. Nilai yang belum terverifikasi ditandai `[BELUM TERVERIFIKASI]`.
- Setiap perubahan hitungan wajib lolos semua `tests/verifikasi_*.py`. Uji yang hanya menyalin rumus JS ke Python belum cukup; tambahkan contoh soal buku (judul dan halaman di komentar) dan uji sifat.
- Teks dari pengguna atau URL (tautan berbagi) harus lewat `esc()` atau `textContent` sebelum masuk `innerHTML`.
- Bank soal: soal dibangkitkan dari templat; kunci selalu dihitung modul `*-hitung.js`. Templat baru wajib masuk `tests/verifikasi_latihan.py`.
- Tampilan dicek di 390 px dan 1280 px, terang dan gelap, tanpa gulir horizontal dan tanpa rumus KaTeX gagal (`.katex-error`). Tautan diperiksa `tests/verifikasi_tautan.py`.
- Format hitungan: diketahui, ditanya, penyelesaian (rumus, sumber, substitusi), hasil dan penjelasan, catatan. Desimal koma, ribuan titik.
- Yang ditunda karena sumber belum terverifikasi: O'Neill & Reese (1999), Terzaghi (1943) untuk pondasi dangkal. Status Meyerhof dan Reese & Wright di kalkulator tiang bor: lihat temuan B1–B5 di rencana.

## Praktikum Mekanika Tanah

Pengolah data praktikum di `docs/praktikum/` (16 alat), disusun mengikuti form laboratorium Mekanika Tanah UNJA dan panduan laporan yang diberikan Defsa.

- Aturan angka panduan laporan: desimal koma, ribuan titik; berat dan volume 3 desimal; persen dan waktu 2 desimal; Gs dan berat isi 3 desimal.
- `kerangka.js`: formulir (tabel `kolom`, `baris`, `daftar`), penyimpanan di browser, tautan berbagi, tempel dari Excel, ekspor TSV/CSV, cetak, dan hasil antaralat (`hasil`, `dariAlat`, `impor`; nilai hanya terisi lewat tombol).
- `ekspor.js`: grafik ke PNG dan laporan ke Word `.docx` tanpa pustaka. Setelah mengubahnya, buka berkas hasilnya untuk memastikan masih terbaca.
- `grafik.js`: grafik SVG (sumbu linier/log, sumbu terbalik).
- Peringatan kuning adalah pemeriksaan kewajaran, bukan ketentuan standar.
- Rumus yang sengaja berbeda dari form atau Excel lab harus mengikuti standar dan perbedaannya dijelaskan di halaman alat (temuan B7). Temuan audit form lab dicatat di Issue #16 repo privat `catatan-pribadi`.
- Alat yang ditambahkan lewat PR #7–#9 memakai sebagian sumber yang melanggar Aturan Sumber; diperiksa ulang di Tahap 2 butir 7.

Menambah alat praktikum: berkas `hitung-<nama>.js`, definisi `alat-<nama>.js` (`Praktikum.pasang({...})`), entri di `konten/praktikum.json`, uji di `tests/verifikasi_praktikum.py`, lalu `python3 skrip/bangun_situs.py`. Alat baru hanya dikerjakan sesuai Aturan wajib 3.

## Alur kerja git

- Mulai dari `main` terbaru, satu branch per tahap, buka Pull Request, lalu berhenti. Defsa yang me-merge.
- Pesan commit dalam bahasa Indonesia, kalimat perintah singkat.
- Kesalahan yang sudah masuk `main` dibatalkan dengan `git revert` lewat PR, bukan dengan menghapus riwayat (kecuali Tahap 1 dengan izin).
- Operasi GitHub (Issue, label, milestone) lewat REST API; GraphQL dibatasi di sesi cloud.
