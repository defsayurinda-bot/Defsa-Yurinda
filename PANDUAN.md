# Panduan menambah isi

Cara menambah catatan, soal, atau alat ke situs, dengan atau tanpa Claude. Ditulis September 2026.

## Yang perlu diketahui dulu

- Tulisan ada di folder `konten/`. Halaman situs di `docs/` dibuat otomatis dari sana, jadi jangan mengedit halaman di `docs/` yang berasal dari `konten/`.
- Daftar semua alat ada di satu berkas: `konten/alat.json`. Kartu di beranda, daftar di halaman Alat, dan tabel di README ikut berubah bila berkas ini diubah.
- Setiap perubahan di `main` diperiksa otomatis (tab **Actions** di GitHub). Tanda hijau berarti semua uji lulus.

## Menambah catatan

**Tanpa Claude, lewat web GitHub**

1. Buka folder `konten/catatan/` di GitHub, klik **Add file → Create new file**.
2. Beri nama dengan nomor berikutnya, misalnya `04-judul-catatan.md` (huruf kecil, dipisah tanda hubung).
3. Baris pertama: `# 04 — Judul catatan`. Isi dengan urutan konsep, contoh dari pengalaman sendiri, lalu latihan.
4. Klik **Commit changes**. Beberapa menit kemudian workflow **Bangun situs** membuat halamannya dan menambahkannya ke beranda.

**Tanpa Claude, di laptop**

```
python3 skrip/buat.py catatan "Judul catatan"
```

Berkas bernomor dibuat di `konten/catatan/`. Isi, lalu jalankan `python3 skrip/bangun_situs.py`.

**Dengan Claude Code:** ketik `/tambah-catatan`.

## Menambah soal latihan

Soal dibuat dari templat di `docs/assets/latihan-soal.js`, dan kuncinya dihitung oleh kalkulator yang sama. Karena itu soal baru butuh sedikit kode dan uji. Cara termudah: ketik `/tambah-soal` di Claude Code dan sebutkan rumus serta sumbernya.

## Menambah alat atau kalkulator

1. Siapkan sumber rumusnya dulu: buku atau standar, beserta halamannya. Tanpa sumber, alat tidak dibuat.
2. Dengan Claude Code: ketik `/tambah-alat` dan kirim halaman sumbernya.
3. Tanpa Claude:
   ```
   python3 skrip/buat.py alat nama-alat --judul "Judul alat" --kategori fondasi --sumber "Penulis (tahun), judul, halaman"
   ```
   Perintah ini membuat berkas rumus, tampilan, halaman, uji, dan entri di `konten/alat.json` dengan status "belum". Rumus dan uji contoh soal buku tetap ditulis sendiri.

## Status alat

| Status | Arti |
|---|---|
| Sumber asli | Rumus dicocokkan dengan sumber aslinya dan diuji dengan contoh soal dari buku |
| Sumber sekunder | Rumus diambil dari sumber yang mengutip sumber asli |
| Belum terverifikasi | Sumber belum lengkap atau belum diperiksa |

## Memeriksa sebelum menerbitkan

```
pip install -r skrip/kebutuhan.txt
python3 skrip/bangun_situs.py
python3 skrip/bangun_situs.py --periksa
for f in tests/verifikasi_*.py; do python3 "$f"; done
```

Semua harus berakhir dengan "Semua cocok." atau "Situs sudah sesuai dengan konten/.".
