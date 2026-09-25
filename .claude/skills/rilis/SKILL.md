---
name: rilis
description: Siapkan rilis versi situs Defsa (CHANGELOG, nomor versi, tag, rilis GitHub). Tag dan rilis hanya dibuat setelah Defsa setuju.
---

# /rilis

1. Pastikan `main` hijau: `python3 skrip/bangun_situs.py --periksa` dan semua `tests/verifikasi_*.py` lulus, CI terakhir di `main` sukses.
2. Kumpulkan perubahan sejak tag terakhir (`git log <tag>..main`), kelompokkan ke `CHANGELOG.md` format Keep a Changelog: Ditambahkan, Diubah, Diperbaiki, Dihapus.
3. Tentukan versi (SemVer): mayor bila hasil hitungan berubah dengan cara yang memengaruhi pemakai lama, minor untuk alat atau fitur baru, patch untuk perbaikan.
4. Perbarui nomor versi di tempat yang memakainya (misalnya `CITATION.cff`, versi cache service worker bila sudah ada).
5. Buka PR rilis dan merge sesuai Aturan wajib 2.
6. **Berhenti dan minta persetujuan Defsa** sebelum membuat tag dan rilis GitHub (Aturan wajib 5). Setelah disetujui: tag `vX.Y.Z` di commit merge, rilis dengan isi CHANGELOG versi itu.
