# 03 — Membangun situs dan kalkulator bersama Claude Code

*Ditulis September 2026.*

Catatan ini merangkum cara situs [defsayurinda-bot.github.io/Defsa-Yurinda](https://defsayurinda-bot.github.io/Defsa-Yurinda/) dibuat: tiga kalkulator geoteknik dan satu bank soal, dikerjakan Claude Code dalam empat tahap, masing-masing lewat Pull Request yang saya periksa hasilnya.

## Konsep

| Istilah | Arti |
|---|---|
| **GitHub Pages** | Layanan GitHub yang menerbitkan isi sebuah folder repo sebagai situs. Di repo ini foldernya `docs/`. Setiap kali `main` berubah, situs ikut diperbarui. |
| **HTML, CSS, JavaScript** | Isi halaman, tampilan, dan perilaku. Situs ini tidak memakai *framework*; semua file bisa dibaca langsung. |
| **GitHub Actions** | Perintah yang dijalankan GitHub secara otomatis, misalnya setiap ada push. Di repo ini dipakai untuk menjalankan pengujian hitungan. |
| **Pengujian (test)** | Program kecil yang memeriksa apakah program lain memberi hasil yang benar. Kalau gagal, PR mendapat tanda ✗ merah. |

## Cara kerja yang dipakai

**1. Rumus dipisah dari tampilan.** Setiap kalkulator punya dua file: `*-hitung.js` hanya berisi rumus, `*-tampilan.js` berisi formulir dan langkah hitungan. Dengan begitu rumusnya bisa diuji tanpa membuka browser.

**2. Setiap hitungan diuji dengan dua cara.**
- Hitungan yang sama ditulis ulang di Python secara terpisah, lalu hasilnya dibandingkan dengan JavaScript.
- Hasil dicocokkan dengan nilai yang sudah dikenal di buku teks, misalnya N<sub>c</sub> = 30,14, N<sub>q</sub> = 18,40, N<sub>γ</sub> = 22,40 untuk φ' = 30°, dan T<sub>v</sub> = 0,848 untuk U = 90%.

**3. Rumus yang belum bisa diverifikasi tidak dimasukkan.** O'Neill & Reese (1999) dan N<sub>γ</sub> Terzaghi (1943) ditunda karena sumber aslinya tidak bisa diakses dari sesi Claude. Lebih baik alatnya belum lengkap daripada angkanya salah.

**4. Kunci jawaban latihan tidak ditulis tangan.** Soal latihan dibangkitkan dengan angka acak, lalu kuncinya dihitung oleh modul kalkulator yang sudah diuji. Bank soal diuji dengan 3.000 soal acak.

**5. Tampilan diperiksa sebelum di-merge.** Claude merender setiap halaman di browser pada lebar desktop dan HP, mode terang dan gelap, lalu memperbaiki yang terpotong atau melebar ke samping.

## Contoh: kesalahan yang tertangkap pengujian

Saat membuat kalkulator konsolidasi, satu pengujian gagal. Pengujian itu membandingkan T<sub>v</sub> hasil deret eksak dengan rumus pendekatan T<sub>v</sub> = (π/4)U² pada U = 55%, dengan toleransi 0,001. Setelah dicek, kalkulatornya benar. Rumus pendekatan itu memang makin menyimpang mendekati U = 60% (selisih 0,55% pada U = 55%, 1,28% pada U = 60%). Yang salah adalah toleransi pengujiannya. Toleransi diubah dan alasannya ditulis di kode.

Pelajarannya: pengujian yang gagal tidak selalu berarti programnya salah. Yang penting, setiap kegagalan dicari penyebabnya, bukan dihapus supaya lulus.

## Pembagian kerja

| Dikerjakan Claude | Dikerjakan saya |
|---|---|
| Menulis kode, pengujian, dan catatan | Membuat repo dan menyalakan GitHub Pages (Settings → Pages) |
| Menjalankan pengujian dan merender halaman | Memutuskan isi, metode, dan apa yang boleh tampil publik |
| Membuat PR, menunggu pengujian lulus, lalu merge | Memeriksa hasil dan mencoba kalkulator dengan soal kuliah |

## Latihan

1. Buka [kalkulator pondasi dangkal](https://defsayurinda-bot.github.io/Defsa-Yurinda/kalkulator/pondasi-dangkal.html), isi dengan data dari satu contoh soal di buku Mekanika Tanah atau Teknik Pondasi, lalu bandingkan hasilnya dengan jawaban buku. Kalau berbeda, cari penyebabnya: metode faktor yang berbeda, pembulatan, atau salah input?
2. Buka tab **Actions** di repo ini dan cari satu *run* "Verifikasi hitungan". Apa saja yang dijalankan di dalamnya?
