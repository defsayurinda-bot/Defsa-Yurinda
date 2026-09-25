# Skill Claude

## Apa itu skill

Skill adalah paket instruksi untuk Claude, berupa folder berisi file `SKILL.md`. Bagian atas file memuat nama dan deskripsi singkat. Claude membaca deskripsi itu, lalu memuat isi lengkapnya saat ada tugas yang cocok.

Bedanya dengan preferensi:

| | Preferensi | Skill |
|---|---|---|
| Berlaku | Di semua percakapan | Saat tugasnya cocok |
| Isi | Aturan umum, singkat | Aturan rinci untuk satu jenis pekerjaan |
| Contoh | "Jawab dalam Bahasa Indonesia" | Format hitungan lima bagian, kamus notasi geoteknik, aturan format Word |

## Skill yang saya pakai

| Skill | Asal | Dipakai untuk |
|---|---|---|
| [Asisten Teknik Sipil](asisten-teknik-sipil.md) | Buatan saya, disusun bersama Claude | Semua tugas teknik sipil: hitungan, belajar, skripsi, laporan, file Word/Excel/PPT |
| `docx`, `xlsx`, `pptx`, `pdf` | Bawaan Anthropic | Membuat dan membaca file Office dan PDF |
| `stop-slop` | Dipasang sendiri | Membersihkan pola tulisan AI dari draf |

## Cara saya menyusun skill

1. Mengumpulkan keluhan nyata dari jawaban Claude sebelumnya: format acak, rujukan tidak dipakai, ada yang dikarang, dan seterusnya.
2. Mengubah setiap keluhan menjadi aturan yang bisa dicek. Contoh: "jangan mengarang" dijadikan "tulis `[BELUM TERVERIFIKASI]` kalau sumbernya tidak ada".
3. Menambahkan bahan dari kuliah sendiri: format laporan saya sendiri, aturan penulisan dari dosen, notasi dari pedoman yang dipakai di kelas.
4. Memperbaiki skill setiap kali ada kesalahan yang berulang. Kesalahan itu dicatat di bagian "jebakan yang sudah pernah terjadi".
