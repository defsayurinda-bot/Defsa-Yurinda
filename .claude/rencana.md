## Status tahap

- [ ] Tahap 0: Fondasi (identitas git, PR draft perubahan praktikum, rencana, CLAUDE.md, settings, Issue)
- [ ] Tahap 1: Akun dan riwayat
- [ ] Tahap 2: Kebenaran hitungan dan keamanan
- [ ] Tahap 3: Mudah ditambah
- [ ] Tahap 4: Tampilan
- [ ] Tahap 5: Isi dan portofolio
- [ ] Tahap 6: Standar repo populer
- [ ] Tahap 7: Kualitas situs, lalu rilis v1.0.0

Catatan Tahap 0 (25 September 2026): perubahan praktikum yang disebut "belum di-commit" ternyata sudah masuk `main` lewat PR #7–#10 sebelum Tahap 0 dimulai. Lihat laporan Tahap 0 di PR `tahap-0/fondasi`.

---

# Rencana perbaikan repo Defsa (disusun 25 September 2026)

## Keputusan Defsa
| Butir | Keputusan |
|---|---|
| Fungsi situs | Portofolio kerja, alat hitung dan praktikum, catatan belajar, alat coba-coba. Beranda: profil singkat dengan tombol CV dan kontak, lalu sorotan alat |
| Tampilan | Dua konsep beranda dulu; Defsa memilih dari tangkapan layar. (a) Turunan template presentasi Defsa: latar putih, pita oranye `#F05A28`, judul distabilo kuning `#FFFF00`, huruf tebal bergaya Arial Black hanya untuk judul (pakai padanan berlisensi terbuka seperti Archivo Black yang disimpan lokal, karena Arial Black tidak ada di banyak HP), tanpa logo kampus. (b) Lembar gambar kerja: kop seperti etiket gambar AutoCAD, grid tipis, huruf teknik |
| Akun dan alamat | Defsa mengganti username menjadi `defsayurinda`; repo situs menjadi `defsayurinda.github.io`; repo profil menjadi `defsayurinda` |
| Riwayat commit | Riwayat kedua repo publik ditulis ulang dengan satu kali force push setelah Defsa mengizinkan |
| Merge | Hanya Defsa |
| Bahasa | Indonesia; beranda, tentang, CV, dan README juga dalam bahasa Inggris sederhana |
| Teknologi | Tetap HTML, CSS, JavaScript biasa, dan skrip Python |
| Urusan pribadi | Di repo privat `Defsa`, tidak pernah di repo publik |
| Kontak | Email khusus lamaran dan LinkedIn setelah Defsa mengirimnya; sebelum itu hanya GitHub |
| Tiang bor | Hasil Meyerhof disembunyikan sampai rumus dari PUPR 2019 dikirim Defsa; Reese & Wright tetap tampil dengan asumsinya ditulis |
| Contoh prompt "Tulis subbab" | Diganti contoh memeriksa draf tulisan sendiri |
| Lisensi | MIT untuk kode, CC BY 4.0 untuk tulisan |

## Aturan Sumber
Sumber yang boleh, berurutan:
1. Rujukan dari Defsa: buku, modul, form lab, halaman yang ia kirim.
2. SNI dan pedoman kementerian (PUPR, Bina Marga), dikutip dengan nomor dan pasal.
3. Buku teks standar (Das, Hardiyatmo, Bowles, Craig), dengan bab dan halaman.
4. Jurnal terakreditasi atau bereputasi.
5. Halaman resmi BSN, ASTM, atau AASHTO, hanya untuk judul dan status standar.
Dilarang: salinan dokumen standar yang diunggah pihak lain (Academia, Scribd, server kampus), situs pekerjaan rumah (Numerade, Chegg, dan sejenisnya), blog atau kalkulator online tanpa penulis, dan forum. Standar yang sudah ditarik tidak menjadi acuan utama (ASTM D422 ditarik 2016; penggantinya D6913 dan D7928). Nilai yang belum bisa diverifikasi ditandai `[BELUM TERVERIFIKASI]` dan dilaporkan ke Defsa.

## Aturan tulisan dan tampilan
- Teks situs: bahasa Indonesia santai tapi rapi. Tanpa pembuka kosong, kata penekanan tanpa angka (sangat, krusial, signifikan, vital), rincian tiga hal yang dipaksakan, nada iklan, kalimat meta, atau tanda pisah panjang yang berlebihan.
- Hindari ciri template AI: latar krem dengan aksen oranye-bata, label kapital berspasi dengan titik tengah di atas judul, kartu bundar seragam dengan bayangan yang sama, panah "→" di teks tautan, logo nama dengan titik berwarna, animasi muncul di setiap bagian.
- Wajib: kontras WCAG AA, fokus keyboard terlihat, `prefers-reduced-motion` dihormati, tanpa gulir horizontal di 390 px, mode gelap, dan gaya cetak tetap jalan.
- Ekspor Excel: Times New Roman, paling banyak 1–2 warna lembut, garis tipis rapi.
- Desimal koma dan ribuan titik; aturan angka yang lama tetap berlaku.
- Tangkapan layar: boleh memasang alat sementara (misalnya Playwright) di sesi tanpa menambahkannya ke repo.

## Temuan audit (25 September 2026)
Tingkat: F = Fatal, P = Perlu cek, K = Kosmetik.
| Kode | Tk | Temuan | Perbaikan (tahap) |
|---|---|---|---|
| A1 | F | 18 commit memakai email `187654321+defsa-yurinda@users.noreply.github.com`; GitHub mengatribusikannya ke akun orang lain | Identitas benar (T0); tulis ulang riwayat (T1) |
| A2 | P | Gmail pribadi di 5 commit merge | Email privat (Defsa); tulis ulang riwayat (T1) |
| A3 | P | Nama akun berakhiran "-bot" | Ganti nama oleh Defsa (T1) |
| A4 | P | Alamat utama `*.github.io/` 404; `robots.txt` di subfolder tidak dibaca | Repo situs menjadi `<akun>.github.io` (T1) |
| A5 | P | Claude me-merge PR sendiri ±1 menit setelah commit | Hanya Defsa yang merge (T0) |
| B1 | F | Tahanan ujung Meyerhof `38 N̄ (Lb/d) ≤ 380 N̄` kPa adalah rumus tiang pancang, dipakai utuh untuk tiang bor | Sembunyikan, lalu perbaiki sesuai PUPR 2019 (T2) |
| B2 | F | Lb hanya dihitung dari baris lapisan tempat ujung. Pasir N = 30 seragam, L = 12 m: Qu 6.635 kN bila 1 baris, 2.337 kN bila 2 baris. Ujung tepat di batas N 15/45 (L = 10,00 m): Qp = 0 | Gabung baris sejenis, transisi sesuai sumber, uji sifat (T2) |
| B3 | P | Opsi tiang pancang ada di kalkulator tiang bor; soal mengajarkan "tiang bor = perpindahan kecil, pembagi 100" tanpa sumber | Hapus opsi; label dan soal sesuai sumber (T2) |
| B4 | P | N > 53 dipotong menjadi 53 (Reese & Wright); N₆₀ diminta untuk kedua metode tanpa sumber | Tampilkan sebagai asumsi (T2) |
| B5 | P | Uji tiang bor hanya menyalin rumus JS ke Python; tidak ada nilai acuan buku | Contoh soal buku dan uji sifat (T2) |
| B6 | P | Nama dari tautan berbagi (hash URL) masuk `innerHTML` tanpa escape: pesan galat, daftar belum lengkap, judul langkah Atterberg | `esc()`/`textContent` dan uji XSS (T2) |
| B7 | P | Alat konsolidasi lab dan berat jenis sengaja berbeda dari Excel/panduan lab tanpa peringatan (cv = ¼ nilai Excel lab) | Kotak catatan beda (T2) |
| C1 | P | Catatan 01: "Claude tidak ingat percakapan dari sesi lain", salah untuk claude.ai | Perbaiki (T5) |
| C2 | P | Klaim "diverifikasi dari sumber asli" dan "diuji terhadap nilai tabel buku" tidak benar untuk tiang bor | Sesuaikan (T5); lencana status (T7) |
| C3 | P | Software ditulis "Lancar", padahal penilaian Defsa "lumayan mahir" | "Menengah" beserta bukti (T5) |
| C4 | P | Kontak hanya GitHub | Sesuai Keputusan (T5) |
| C5 | P | Tidak ada CV, KP, gambar tugas besar, atau sertifikat | Portofolio dan CV (T5) |
| C6 | P | Contoh prompt publik "Tulis subbab [2.1]" | Ganti (T5) |
| C7 | K | Kalimat pembuka beranda bernada iklan | Tulis ulang (T5) |
| D1 | P | CC BY 4.0 juga dipakai untuk kode | MIT dan CC BY 4.0 (T5) |
| D2 | K | KaTeX dan font dari CDN tanpa `integrity` | Simpan lokal (T7) |
| D3 | K | Workflow tanpa `permissions`; satu branch acak untuk 10 PR | Perbaiki (T6); branch per tahap (T0) |
| D4 | K | Palet krem dan oranye-bata serta ciri template AI lain | Tampilan baru (T4) |
Yang sudah benar dan tidak dibongkar: rumus pondasi dangkal dan konsolidasi (cocok dengan Das), alur `konten/` ke `docs/` dengan pemeriksaan CI, pemisahan berkas hitung dan tampilan, aturan privasi di CLAUDE.md, dan README profil yang memperbarui diri.

## Tahap 1: Akun dan riwayat
Langkah manual Defsa di GitHub (Claude hanya memandu bila diminta):
1. Settings → Emails: nyalakan *Keep my email addresses private* dan *Block command line pushes that expose my email*.
2. Tugas di Issue #3: foto profil, 2FA, pin repo.
3. Settings → Account: ganti username menjadi `defsayurinda`.
4. Ganti nama repo `Defsa-Yurinda` menjadi `defsayurinda.github.io` dan `defsayurinda-bot` menjadi `defsayurinda`; pastikan Pages tetap dari `main` folder `/docs`.
5. Mulai sesi Claude Code baru dan pilih ulang repo yang sudah berganti nama.
Tugas Claude:
1. Ganti identitas ke `310235006+defsayurinda@users.noreply.github.com` di CLAUDE.md, `.claude/settings.json`, dan config git.
2. Perbarui semua rujukan nama lama (`defsayurinda-bot`, `Defsa-Yurinda`, `/Defsa-Yurinda/`) di kedua repo: HTML, sitemap, `og:url`, 404, README, skrip README profil, konstanta di tests, dan CLAUDE.md. Tampilkan hasil `grep` sebelum dan sesudah.
3. Siapkan penulisan ulang riwayat kedua repo dengan `git filter-repo` dan mailmap: email salah dan Gmail menjadi noreply baru; commit `github-actions[bot]` tidak diubah. Tampilkan `git log --format='%h %an <%ae>'` hasilnya, lalu BERHENTI dan minta izin force push. Setelah diizinkan: force push, lalu rebase `simpan/praktikum-belum-verifikasi` ke `main` yang baru.
4. Laporkan bahwa commit lama tetap terlihat di halaman PR #1–#10 karena ref PR di GitHub tidak ikut berubah. Yang dibersihkan adalah riwayat `main`, grafik kontribusi, dan daftar kontributor.
5. Tanyakan apakah riwayat repo privat `Defsa` juga mau ditulis ulang.
Selesai bila: `https://defsayurinda.github.io/` menampilkan situs; `grep` nama lama kosong kecuali di catatan riwayat; semua commit `main` beratribusi ke akun `defsayurinda`; semua uji lulus.

## Tahap 2: Kebenaran hitungan dan keamanan
Bahan: rumus dan halaman sumber yang sudah dicek (PUPR 2019 untuk Meyerhof dan zona N̄, sumber Reese & Wright) serta satu contoh soal buku per kalkulator, ditempel Defsa di prompt tahap ini. Tanpa bahan, kerjakan hanya butir yang tidak butuh sumber.
1. B1, B3: sembunyikan hasil Meyerhof di kalkulator dan di templat soal `meyerhof-selimut`, dengan catatan singkat alasannya; hapus opsi tiang pancang dari kalkulator tiang bor. Setelah bahan ada: terapkan rumus dan batas sesuai halaman sumber, lalu tulis nomor halamannya di kode dan di halaman.
2. B2: gabungkan baris lapisan berurutan yang jenis dan N-nya sama sebelum menghitung Lb; transisi dari lapisan lemah ke kuat mengikuti sumber. Uji sifat: memecah lapisan tidak mengubah hasil; memperpanjang tiang ke lapisan lebih keras tidak menurunkan Qp; ujung tepat di batas lapisan tidak memberi Qp = 0.
3. B4: tampilkan pemotongan N = 53 dan jenis N sebagai asumsi kalkulator di hasil.
4. B5: tiap kalkulator punya minimal satu contoh soal utuh dari buku di `tests/`, dengan judul buku dan halaman di komentar. Bila belum ada, tulis kerangka ujinya dan tandai dilewati beserta alasannya.
5. B6: semua teks dari pengguna atau URL lewat `esc()` atau `textContent` sebelum masuk `innerHTML`, termasuk pesan galat, daftar belum lengkap, nama cawan dan kolom, serta judul langkah. Uji: nama `<img src=x onerror=alert(1)>` tampil sebagai teks.
6. B7: kotak catatan di alat yang sengaja berbeda dari Excel atau panduan lab (konsolidasi lab, berat jenis): apa bedanya, mana yang benar menurut standar, dan cara menyamakan bila asisten meminta.
7. PR draft `simpan/praktikum-belum-verifikasi`: periksa setiap rumus dan nilai terhadap Aturan Sumber; ganti sumber yang dilarang atau tandai `[BELUM TERVERIFIKASI]`; laporkan tabel per berkas. Jangan jadikan siap merge sebelum Defsa setuju.
Selesai bila: uji sifat dan uji XSS lulus; kasus bukti B2 memberi hasil yang wajar; tidak ada sumber terlarang di kode maupun halaman.

## Tahap 3: Mudah ditambah
1. Registri tunggal `konten/alat.json` untuk semua alat, berisi: id, judul, deskripsi, kategori, halaman, skrip, sumber, status verifikasi (asli / sekunder / belum), tanggal cek, dan berkas uji. `konten/praktikum.json` boleh tetap sebagai sub-daftar yang dirujuk registri.
2. `skrip/bangun_situs.py` membangun dari registri: kartu beranda, halaman Alat, menu, sitemap, dan tabel alat di README (di antara penanda). Skrip README profil membaca registri lewat URL raw, bukan mengurai HTML.
3. `skrip/buat.py`: `python3 skrip/buat.py alat <id>` membuat berkas hitung (pola UMD), tampilan, halaman, uji (kerangka contoh soal buku dan uji sifat), dan entri registri berstatus "belum". `python3 skrip/buat.py catatan "<judul>"` membuat catatan bernomor berikutnya.
4. CI memeriksa registri: setiap alat punya berkas, uji, dan sumber; status "asli" wajib punya uji contoh soal buku.
5. Workflow yang membangun ulang `docs/` saat `konten/` berubah di `main`, lalu meng-commit hasilnya sebagai `github-actions[bot]`. Tujuannya supaya Defsa bisa menambah catatan lewat editor web GitHub tanpa menjalankan Python.
6. Skill proyek di `.claude/skills/` yang menjadi perintah garis miring:
   - `/tambah-alat`: minta sumber dulu, jalankan buat.py, tulis rumus, uji, ambil tangkapan layar, buka PR, lalu berhenti.
   - `/tambah-catatan` dan `/tambah-soal`.
   - `/audit-rumus`: hanya memeriksa dan melapor dengan tabel Fatal / Perlu cek / Kosmetik.
   - `/rilis`: CHANGELOG, versi, tag, dan rilis setelah Defsa setuju.
7. `PANDUAN.md` dalam bahasa sederhana: cara Defsa menambah catatan, soal, atau alat, dengan maupun tanpa Claude.
Selesai bila: alat percobaan yang dibuat lewat `buat.py` (lalu dibatalkan) otomatis muncul di kartu, menu, sitemap, dan README tanpa edit manual; semua uji lulus.

## Tahap 4: Tampilan
1. Buat dua konsep beranda sesuai Keputusan di folder `prototipe/` pada branch tersendiri. Tiap konsep memuat 4–6 warna bernama (hex), peran huruf, satu kalimat prinsip tata letak, dan tangkapan layar 390 dan 1280 px dalam mode terang dan gelap. BERHENTI: Defsa memilih atau mencampur.
2. Setelah dipilih: susun token di `docs/assets/gaya.css`, lalu terapkan ke semua jenis halaman (beranda, daftar alat, kalkulator, praktikum, latihan, catatan, tentang, 404) dan ke banner README profil versi terang dan gelap.
3. Minta izin menghapus `prototipe/` sebelum PR akhir.
Selesai bila: laporan memuat tangkapan layar tiap jenis halaman di dua lebar dan dua mode; tidak ada ciri template AI yang disebut di Aturan tulisan dan tampilan; semua uji lulus.

## Tahap 5: Isi dan portofolio
Bahan dari Defsa: CV, tautan LinkedIn, email khusus lamaran, gambar tugas besar yang boleh tampil, foto KP yang boleh tampil (bukan gambar kerja proyek), dan daftar sertifikat. Bagian yang bahannya belum ada tidak ditampilkan, tanpa placeholder.
1. C1: catatan 01 membedakan claude.ai (memori dan pencarian riwayat chat, bisa diatur di Settings) dengan Claude Code (CLAUDE.md dan memori otomatisnya sendiri). Periksa dokumentasi resmi sebelum menulis fakta fitur, dan cantumkan bulan penulisan.
2. C2: klaim di beranda dan README profil disesuaikan dengan status tiap alat.
3. C3: "Lancar" menjadi "Menengah", disertai tugas besar yang membuktikannya.
4. C4: kontak sesuai Keputusan.
5. C5: halaman Portofolio berisi KP (peran dan pekerjaan Defsa), tugas besar AutoCAD/Revit, topik skripsi tanpa data proyek, dan sertifikat.
6. CV dari satu sumber (`konten/cv.md` dan `konten/cv-en.md`) menjadi halaman cetak siap simpan PDF, dengan struktur sederhana agar terbaca sistem ATS.
7. C6: contoh "Tulis subbab" diganti contoh memeriksa draf tulisan sendiri.
8. C7: kalimat pembuka beranda ditulis ulang, datar dan jelas.
9. Halaman bahasa Inggris untuk beranda, tentang, dan CV di `/en/` dengan tombol bahasa; `README.en.md` dengan tautan bahasa di kedua README. Bahasa Inggris sederhana; Defsa memeriksa sebelum merge.
10. D1: lisensi MIT untuk kode di `LICENSE`, CC BY 4.0 untuk tulisan di berkas terpisah; footer dan README disesuaikan.
Selesai bila: tidak ada placeholder; `verifikasi_tautan.py` lulus; tidak ada data pribadi selain yang diberikan Defsa.

## Tahap 6: Standar repo populer
1. README baru: satu kalimat penjelasan, tangkapan layar, lencana (status CI, lisensi, situs, versi rilis), tabel fitur dari registri, cara pakai, cara menambah (tautan ke PANDUAN), cara mengutip, kontribusi, dan lisensi.
2. `CITATION.cff` yang valid: penulis Defsa Yurinda, judul, versi, tanggal rilis, URL, dan lisensi.
3. CONTRIBUTING.md dan SECURITY.md dalam bahasa Indonesia. CODE_OF_CONDUCT.md memakai teks resmi Contributor Covenant (terjemahan resmi bila ada; kalau tidak ada, teks resmi bahasa Inggris), tidak ditulis ulang sendiri.
4. `.github/ISSUE_TEMPLATE/` berbentuk formulir:
   - "Laporkan salah hitung": alat, tautan berbagi atau data masukan, hasil, dan hasil yang diharapkan beserta sumbernya.
   - "Usul alat": nama, metode, dan sumber dengan halaman.
   - `config.yml`.
   Templat PR berisi checklist: sumber, uji, `--periksa`, tangkapan layar, tanpa data pribadi, aksesibilitas dicek manual.
5. `CHANGELOG.md` format Keep a Changelog; Dependabot untuk GitHub Actions; `permissions: contents: read` di workflow verifikasi.
6. Gambar pratinjau sosial 1280 × 640 px di `docs/assets/`.
7. README profil ditulis ulang mengikuti tampilan baru, singkat, dalam dua bahasa.
8. Daftar langkah manual untuk Defsa: isi topics, deskripsi, dan website repo; unggah gambar pratinjau sosial; aktifkan *Private vulnerability reporting*; pin repo di profil.
Selesai bila: GitHub menampilkan tombol "Cite this repository"; templat muncul saat membuat Issue baru; semua uji lulus.

## Tahap 7: Kualitas situs, lalu rilis v1.0.0
1. D2: KaTeX beserta fontnya dan font situs disimpan di `docs/assets/`, tanpa CDN.
2. Bisa dipakai offline: manifest dan service worker yang menyimpan aset inti; versi cache mengikuti versi rilis.
3. Pencarian di seluruh situs dari indeks JSON yang dibangun `bangun_situs.py`.
4. Tombol "Laporkan salah hitung" di tiap alat yang membuka Issue baru dengan templat dan tautan berbagi terisi, disertai peringatan bahwa isi Issue terlihat publik.
5. Lencana status di tiap alat dari registri: sumber asli, sumber sekunder, atau belum terverifikasi, beserta tanggal cek.
6. Tanya Defsa, lalu jalankan `/rilis` v1.0.0.
Selesai bila: halaman yang pernah dibuka tetap tampil tanpa jaringan (bila bisa diuji); pencarian menemukan alat dan catatan; semua uji lulus.

## Backlog (milestone v1.1; satu butir satu PR lewat /tambah-alat; urutan)
1. Konversi satuan geoteknik (kg/cm², t/m², kPa, ton, kN).
2. Interpretasi uji beban statik: Davisson, Chin–Kondner, Mazurkiewicz, dengan grafik. Data diolah di browser dan tidak pernah disimpan di repo.
3. Efisiensi kelompok tiang (Converse–Labarre) dan beban tiap tiang.
4. Antrean lama: metode Casagrande (tanya Defsa dulu: untuk σ'c atau t₅₀ di alat konsolidasi lab) dan catatan 04.
5. Koreksi N-SPT (N₆₀, (N₁)₆₀) dan korelasi parameter tanah, setelah Defsa mengirim halaman PUPR 2019.
6. Daya dukung tiang dari sondir, dengan sumber yang sama seperti butir 5.
7. Berat dan panjang besi tulangan serta rekap pembesian, dengan ekspor Excel.
8. Tekanan tanah lateral dan cek dinding penahan.
9. Prapembebanan dengan PVD untuk tanah lunak dan gambut.
10. Kartu istilah teknik sipil Indonesia–Inggris.
11. Bank soal untuk mata kuliah semester 7, dengan mode ujian berwaktu dan skor disimpan di browser.
12. Stabilitas lereng metode irisan (Fellenius, Bishop).
13. RAB berbasis AHSP, hanya bila Defsa memberi berkas AHSP resmi.
