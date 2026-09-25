# Kebijakan keamanan

Situs ini statis (HTML, CSS, JavaScript di GitHub Pages) dan tidak menyimpan data pengguna di server. Data kalkulator dan praktikum hanya disimpan di browser pengguna dan di tautan berbagi.

## Yang termasuk celah keamanan

- Teks dari tautan berbagi atau isian formulir yang bisa menjalankan skrip (XSS).
- Tautan berbagi yang bisa membuat halaman memuat sumber dari luar situs.
- Workflow GitHub Actions yang bisa disalahgunakan untuk mengubah isi repo.

Salah hitung bukan celah keamanan; laporkan lewat Issue biasa dengan templat **Laporkan salah hitung**.

## Cara melapor

Jangan buka Issue publik untuk celah keamanan. Pakai **Report a vulnerability** di tab *Security* repo ini (GitHub private vulnerability reporting). Sertakan langkah untuk mengulang dan halaman yang terdampak.

Laporan akan dijawab sesempatnya; repo ini dikelola satu orang.

## Versi yang didukung

Hanya versi yang sedang terbit di https://defsayurinda.github.io/ (cabang `main`).
