# Prototipe beranda (Tahap 4)

Dua konsep beranda untuk dipilih atau dicampur. Folder ini hanya ada di branch `tahap-4/prototipe` dan dihapus setelah tampilan terpilih diterapkan. Buka `a/index.html` atau `b/index.html` langsung di browser; semua huruf disimpan lokal di `font/` (SIL Open Font License, dari paket Fontsource).

## Konsep A: pita dan stabilo

Turunan template presentasi Defsa: latar putih, pita oranye, judul distabilo kuning, huruf tebal hanya untuk judul.

| Nama | Terang | Gelap | Peran |
|---|---|---|---|
| Kertas slide | `#FFFFFF` | `#161616` | Latar |
| Tinta | `#1A1A1A` | `#F2F2F2` | Teks utama (17,4:1 dan 16,2:1) |
| Pita oranye | `#F05A28` | `#F05A28` | Pita atas, penanda judul, garis footer. Hanya hiasan (3,4:1, tidak dipakai untuk teks) |
| Oranye bakar | `#B23C0C` | `#FF8B5E` | Tautan dan label bidang (5,9:1 dan 7,9:1) |
| Stabilo | `#FFFF00` | `#FFFF00` | Latar judul; teks di atasnya selalu `#1A1A1A` (16,2:1) |
| Abu teks | `#595959` | `#B3B3B3` | Teks kedua (7,0:1 dan 8,6:1) |

Huruf: **Archivo Black** untuk judul (padanan Arial Black yang disimpan lokal), **Source Sans 3** untuk isi dan tombol.

Prinsip tata letak: satu kolom lebar dengan judul bagian yang dibuka pita oranye dan distabilo, alat disusun sebagai daftar bergaris seperti isi slide, bukan kartu.

## Konsep B: lembar gambar kerja

Halaman seperti lembar gambar AutoCAD: bingkai ganda, kisi tipis di latar, daftar alat seperti daftar gambar, dan kop etiket di kanan bawah. Mode gelap menjadi cetak biru.

| Nama | Terang | Gelap | Peran |
|---|---|---|---|
| Kertas kalkir / biru cetak | `#F4F7FA` | `#0C2136` | Latar lembar |
| Tinta gambar | `#102A43` | `#E6EEF5` | Teks, bingkai, garis tabel (13,6:1 dan 13,9:1) |
| Garis kisi | `#DCE5EE` | `#16324F` | Kisi latar, hanya hiasan |
| Biru garis ukur | `#1B5A9E` | `#8CC2FF` | Tautan (6,5:1 dan 8,8:1) |
| Merah revisi / kuning revisi | `#B3261E` | `#F2C94C` | Nomor bagian dan fokus keyboard (6,1:1 dan 10,3:1) |
| Abu teks | `#4A5D70` | `#9FB3C8` | Teks kedua (6,3:1 dan 7,6:1) |

Huruf: **IBM Plex Sans Condensed** untuk judul dan isi (mirip huruf teknik yang sempit), **IBM Plex Mono** untuk nomor, kode alat, dan kop etiket.

Prinsip tata letak: satu lembar berbingkai dengan isi tersusun dalam tabel bergaris tegas, penomoran seperti daftar gambar, dan identitas di kop etiket.

## Pemeriksaan

- Tanpa gulir horizontal di 390 px dan 1280 px, terang dan gelap (scrollWidth sama dengan lebar layar).
- Semua huruf termuat dari `font/` tanpa CDN.
- Fokus keyboard terlihat; `prefers-reduced-motion` dihormati; tidak ada animasi muncul.
- Tidak memakai ciri template AI yang disebut di rencana: tanpa latar krem, tanpa label kapital berspasi bertitik tengah di atas judul, tanpa kartu bundar seragam berbayang, tanpa panah di teks tautan, tanpa logo nama bertitik warna.
- Tombol "CV (menyusul)" hanya ada di prototipe; di situs, tombol CV baru muncul setelah bahan CV ada (Tahap 5).

## Tangkapan layar

`tangkapan/a-390-terang.png`, `a-390-gelap.png`, `a-1280-terang.png`, `a-1280-gelap.png`, dan hal yang sama untuk `b-`.
