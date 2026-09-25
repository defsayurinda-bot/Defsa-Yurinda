# CLAUDE.md

Panduan untuk Claude saat bekerja di repo ini.

## Tentang repo

Repo **publik** milik Defsa Yurinda (mahasiswa Teknik Sipil, Universitas Jambi). Isinya situs GitHub Pages yang menjadi **pintu utama** semua isi publik Defsa: kalkulator geoteknik, latihan soal, catatan belajar, cara memakai AI, skill, dan profil. Lisensi CC BY 4.0.

## Aturan isi

- Semua orang bisa membaca repo ini. Jangan pernah memasukkan: NIM, nomor HP, alamat, email, path folder laptop, data atau nama asli proyek skripsi, nama dosen, draf skripsi, dan detail lomba yang penilaiannya masih *blind*.
- Jangan mengarang pengalaman, pencapaian, atau data tentang Defsa. Kalau informasinya belum ada, tanyakan.
- Fakta tentang fitur Claude hanya ditulis kalau yakin benar. Tulis bulan penulisan di setiap catatan karena fitur bisa berubah.
- Bahasa Indonesia yang santai tapi rapi. Hindari pola tulisan AI.

## Struktur

| Lokasi | Isi |
|---|---|
| `konten/` | Satu-satunya sumber tulisan: `tentang.md`, `catatan/`, `cara-memakai-ai/`, `skill/` |
| `docs/` | Situs. Halaman alat ditulis tangan; halaman tulisan dibangun dari `konten/` |
| `skrip/bangun_situs.py` | Membangun halaman dari `konten/`, menyeragamkan menu dan footer (penanda `NAV`/`FOOTER`), daftar catatan di beranda (penanda `CATATAN`), sitemap |
| `tests/` | Verifikasi hitungan, bank soal, dan tautan |

- **Profil Defsa hanya ditulis di `konten/tentang.md`.** Beranda, README ini, dan README profil GitHub hanya menautkan, tidak menyalin isinya.
- Jangan mengedit halaman hasil bangun (`docs/tentang/`, `docs/catatan/`, `docs/cara-memakai-ai/`, `docs/skill/`) atau teks di antara penanda; edit sumbernya lalu jalankan `python3 skrip/bangun_situs.py`.
- Catatan baru masuk `konten/catatan/` dengan nomor urut berikutnya (`04-...md`), baris pertama `# NN — Judul`, urutan isi: konsep, contoh dari pengalaman Defsa, latihan. Daftar catatan di situs dan profil GitHub terbarui otomatis.
- Tautan antartulisan memakai jalur relatif ke berkas `.md`; skrip mengubahnya menjadi tautan situs.
- Alat baru: tambahkan kartunya di `docs/alat/index.html` (dan di beranda bila perlu).
- Nama file huruf kecil, dipisah tanda hubung.

## Situs dan kalkulator

- Situs ada di `docs/` (HTML, CSS, dan JavaScript biasa) dan diterbitkan lewat GitHub Pages dari branch `main`, folder `/docs`. Satu-satunya langkah bangun adalah `skrip/bangun_situs.py` untuk halaman tulisan; CI gagal bila `docs/` belum dibangun ulang.
- Hitungan dipisah dari tampilan: `docs/assets/*-hitung.js` hanya berisi rumus, `*-tampilan.js` berisi formulir dan langkah hitungan.
- Setiap rumus harus punya sumber yang bisa ditelusuri dan ditulis di halaman. Rumus yang belum bisa diverifikasi tidak dimasukkan. O'Neill & Reese (1999) ditunda karena koefisiennya belum terverifikasi.
- Fungsi bersama (format angka, KaTeX, tautan berbagi) ada di `docs/assets/umum.js`.
- Setiap perubahan hitungan wajib lolos semua `tests/verifikasi_*.py`, yang membandingkan JavaScript dengan perhitungan Python terpisah dan, bila ada, dengan nilai tabel buku teks. Kasus uji baru ditambahkan untuk setiap rumus baru.
- Bank soal (`docs/latihan/`, `docs/assets/latihan-soal.js`): soal dibangkitkan dari templat dengan angka acak berbasis kode soal; kunci jawaban selalu dihitung oleh modul `*-hitung.js`, tidak ditulis tangan. Templat baru wajib ditambahkan ke `tests/verifikasi_latihan.py` beserta hitungan Python-nya.
- Terzaghi (1943) untuk pondasi dangkal ditunda karena N<sub>γ</sub>-nya berupa tabel yang belum diverifikasi.
- Tampilan dicek di lebar HP (390 px) dan mode gelap sebelum di-merge. Tidak boleh ada gulir horizontal. Tautan diperiksa oleh `tests/verifikasi_tautan.py`.
- Format hitungan mengikuti urutan Defsa: diketahui, ditanya, penyelesaian (rumus, sumber, substitusi), hasil dan penjelasan, catatan. Desimal koma, ribuan titik.

## Alur kerja

Kerjakan di branch terpisah, buat Pull Request, lalu Claude yang melakukan merge (keputusan Defsa). Perubahan besar diusulkan dulu dan ditunggu persetujuannya.
