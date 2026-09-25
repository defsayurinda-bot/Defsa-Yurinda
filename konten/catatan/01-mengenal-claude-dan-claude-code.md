# 01 — Mengenal Claude dan Claude Code

*Ditulis September 2026.*

## Claude

Claude adalah asisten AI buatan Anthropic. Saya memakainya lewat [claude.ai](https://claude.ai), di browser atau aplikasi ponsel. Di sana Claude bisa diajak diskusi, membaca file yang dilampirkan (PDF, Word, Excel, gambar), menghitung, dan membuat dokumen.

## Claude Code

Claude Code adalah versi Claude yang bekerja langsung di dalam folder proyek. Kalau di chat Claude hanya memberi jawaban, di Claude Code Claude bisa:

- membaca dan mengubah file di folder atau repo;
- menjalankan perintah, misalnya script Python untuk mengecek hitungan;
- menyimpan perubahan dengan git dan mengirimnya ke GitHub.

Claude Code bisa dipakai di terminal, di aplikasi desktop, di ekstensi editor kode, dan di web ([claude.ai/code](https://claude.ai/code)). Saya memakai versi web. Di versi web, Claude bekerja di server yang menyalin repo GitHub saya, jadi laptop saya tidak perlu menyala.

| | Claude (chat) | Claude Code |
|---|---|---|
| Hasil kerja | Jawaban di chat, file untuk diunduh | Perubahan langsung di file repo |
| Cocok untuk | Diskusi, belajar, dokumen satu kali | Pekerjaan yang disimpan dan dikembangkan terus |
| Riwayat | Tersimpan per percakapan | Tersimpan di git, bisa dilacak per baris |

## Empat hal yang mengatur perilaku Claude

| Nama | Letak | Fungsi |
|---|---|---|
| **Preferensi** | Pengaturan profil di claude.ai | Aturan umum untuk semua percakapan: bahasa, gaya, cara kerja. Punya saya ada di [preferensi.md](../cara-memakai-ai/preferensi.md). |
| **Project** | Fitur di claude.ai | Kumpulan percakapan yang berbagi dokumen dan instruksi yang sama. Saya pakai untuk urusan yang panjang, misalnya lomba. |
| **Skill** | Paket instruksi (file `SKILL.md`) | Aturan khusus untuk jenis tugas tertentu. Claude memuatnya saat tugas yang cocok muncul. Punya saya ada di [skill/](../skill/README.md). |
| **`CLAUDE.md`** | File di dalam repo | Dibaca otomatis oleh Claude Code di setiap sesi yang membuka repo itu. |

Satu hal penting: **cara Claude mengingat berbeda di claude.ai dan di Claude Code.** (Dicek di dokumentasi resmi, September 2026.)

- **claude.ai.** Claude bisa mencari percakapan lama bila diminta (paket berbayar) dan menyimpan memori dari chat. Memori aktif bawaan untuk paket Free, Pro, dan Max, dan setiap project punya memori sendiri. Keduanya diatur di Settings → Memory, termasuk untuk menjeda atau menghapus memori.
- **Claude Code.** Setiap sesi mulai dengan konteks kosong. Yang terbawa ke sesi berikutnya adalah `CLAUDE.md` yang saya tulis dan *auto memory*, yaitu catatan yang ditulis Claude sendiri di folder `~/.claude/projects/` pada komputer tempat Claude Code berjalan.

Memori otomatis membantu, tapi isinya ditentukan Claude. Jadi keputusan penting tetap saya tulis di `CLAUDE.md` atau preferensi, bukan hanya diucapkan di chat.

## Contoh

Di chat biasa, kalau saya minta "hitung daya dukung tiang ini", Claude bisa memakai format apa saja. Setelah preferensi dan skill saya pasang, permintaan yang sama selalu dijawab dengan urutan yang saya tetapkan: diketahui, ditanya, penyelesaian lengkap dengan sumber rumus, hasil, lalu catatan asumsi. Hitungannya juga dicek ulang dengan Python sebelum ditampilkan.

## Latihan

Kalau kamu juga memakai Claude, coba tulis tiga aturan yang paling sering kamu ulang di chat (misalnya "jawab dalam Bahasa Indonesia", "tulis sumbernya"). Masukkan ketiganya ke preferensi, lalu bandingkan jawaban Claude sebelum dan sesudahnya.
