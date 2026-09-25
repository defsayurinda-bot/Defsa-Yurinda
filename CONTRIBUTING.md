# Berkontribusi

Terima kasih sudah mau membantu. Repo ini dikelola satu orang (Defsa Yurinda) sebagai bagian dari kuliah, jadi Pull Request diperiksa sesempatnya.

## Cara paling berguna: laporkan salah hitung

Kalau hasil kalkulator berbeda dengan buku atau hitungan tangan, buka Issue dengan templat **Laporkan salah hitung**. Sertakan:

- tautan hasil (tombol *Salin tautan hasil* di kalkulator) atau data masukan;
- hasil kalkulator dan hasil yang kamu harapkan;
- sumbernya: judul buku atau standar, edisi, dan halaman.

Laporan tanpa sumber tetap diterima, tapi perbaikan rumus hanya dilakukan setelah sumbernya bisa diperiksa.

## Usul alat baru

Pakai templat **Usul alat**. Alat baru hanya dibuat bila rumusnya punya sumber yang memenuhi Aturan Sumber di [`.claude/rencana.md`](.claude/rencana.md): SNI atau pedoman kementerian, buku teks standar dengan bab dan halaman, atau jurnal bereputasi. Situs pekerjaan rumah, blog tanpa penulis, dan salinan standar yang diunggah pihak lain tidak dipakai.

## Pull Request

1. Baca [PANDUAN.md](PANDUAN.md) untuk struktur repo.
2. Buat branch dari `main`. Pesan commit dalam bahasa Indonesia, kalimat perintah singkat.
3. Jalankan sebelum membuka PR:
   ```
   pip install -r skrip/kebutuhan.txt
   python3 skrip/bangun_situs.py
   python3 skrip/bangun_situs.py --periksa
   for f in tests/verifikasi_*.py; do python3 "$f"; done
   ```
4. Perubahan rumus wajib disertai contoh soal buku (judul dan halaman di komentar) dan uji sifat di `tests/`.
5. Isi checklist di templat PR.

## Yang tidak diterima

- Data pribadi siapa pun, termasuk nama dosen, asisten, atau mahasiswa dari form lab.
- Rumus atau nilai tabel tanpa sumber.

Dengan berkontribusi, kamu setuju kodenya dirilis dengan lisensi [MIT](LICENSE) dan tulisannya dengan [CC BY 4.0](LICENSE-TULISAN), dan mengikuti [Kode Etik](CODE_OF_CONDUCT.md).
