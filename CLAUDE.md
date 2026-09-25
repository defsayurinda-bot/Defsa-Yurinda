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

## Praktikum Mekanika Tanah

Pengolah data praktikum di `docs/praktikum/`, disusun mengikuti form laboratorium Mekanika Tanah UNJA yang diberikan Defsa (urutan baris, simbol W1, W2, …) dan panduan laporan.

- **Aturan angka dari panduan laporan:** desimal koma, ribuan titik; besaran berat dan volume 3 desimal; persentase dan waktu 2 desimal; Gs dan berat isi 3 desimal.
- **Kerangka bersama** (`docs/assets/praktikum/kerangka.js`) sudah menangani formulir tabel, angka berkoma, identitas contoh untuk kop cetak, penyimpanan otomatis di browser, tautan berbagi, salin ke Excel (TSV), unduh CSV (pemisah `;`, desimal koma), dan cetak. `grafik.js` membuat grafik SVG (sumbu linier/log).
- Peringatan kuning adalah pemeriksaan kewajaran, bukan ketentuan standar; ambangnya harus masuk akal dan disebut sebagai pemeriksaan.
- Rumus yang berbeda dari form lab harus mengikuti yang benar menurut standar, dan perbedaannya disampaikan ke Defsa. Contoh: panduan laporan menulis penyebut Gs dengan tanda "+" padahal yang benar "−"; ρw pada 27,5 °C di Excel lab 0,99640515, sedangkan Tanaka (2001) memberi 0,996376.
- Jangan memuat nama mahasiswa, asisten, atau dosen dari berkas panduan/form ke repo publik.

### Menambah alat praktikum

1. `docs/assets/praktikum/hitung-<nama>.js`: fungsi rumus murni dengan pola UMD (bisa `require` di Node), mengembalikan `{ galat: [], peringatan: [], … }`.
2. `docs/assets/praktikum/alat-<nama>.js`: `Praktikum.pasang({ id, parameter, tabel, contoh, hitung, tampil, ekspor, sumber })`. Contoh paling sederhana: bagian kadar air di `alat-sifat-fisik.js`.
3. `konten/praktikum.json`: tambah atau ubah entri (`status: "tersedia"`, daftar `skrip`), lalu jalankan `python3 skrip/bangun_situs.py`. Halaman alat dan halaman induk dibuat otomatis.
4. `tests/verifikasi_praktikum.py`: tambah hitungan Python terpisah dan nilai acuan bila ada.
5. Periksa tampilan di 1280 px dan 390 px, terang dan gelap.

Alat yang masih `menyusul` (hidrometer, klasifikasi, CBR, geser langsung, UCS, konsolidasi laboratorium, sondir, SPT) dicatat di Issue repo pribadi Defsa.

## Alur kerja

Kerjakan di branch terpisah, buat Pull Request, lalu Claude yang melakukan merge (keputusan Defsa). Perubahan besar diusulkan dulu dan ditunggu persetujuannya.
