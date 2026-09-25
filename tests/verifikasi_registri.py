"""Verifikasi registri alat konten/alat.json.

Setiap alat wajib punya halaman, berkas skrip, berkas uji, dan minimal satu sumber. Status
"asli" hanya boleh dipakai bila salah satu berkas ujinya memuat contoh soal buku (penanda
CONTOH-BUKU) dan tidak lagi mencetak "DILEWATI  contoh soal buku". Setiap halaman di
docs/kalkulator/ wajib terdaftar.

Jalankan dari akar repo:  python3 tests/verifikasi_registri.py
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
DOCS = AKAR / "docs"
WAJIB = ("id", "judul", "judul_pendek", "deskripsi", "kategori", "lencana", "halaman", "ringkas",
         "rincian", "skrip", "sumber", "status", "tanggal_cek", "uji")


def main():
    reg = json.loads((AKAR / "konten/alat.json").read_text(encoding="utf-8"))
    kategori = {k["id"] for k in reg["kategori"]}
    gagal, id_terlihat = [], set()

    for a in reg["alat"]:
        nama = a.get("id", "?")
        kurang = [k for k in WAJIB if k not in a]
        if kurang:
            gagal.append(f"{nama}: kolom hilang {kurang}")
            continue
        if nama in id_terlihat:
            gagal.append(f"{nama}: id ganda")
        id_terlihat.add(nama)
        if a["kategori"] not in kategori:
            gagal.append(f"{nama}: kategori {a['kategori']} tidak dikenal")
        if a["status"] not in ("asli", "sekunder", "belum"):
            gagal.append(f"{nama}: status {a['status']} tidak dikenal")
        try:
            date.fromisoformat(a["tanggal_cek"])
        except ValueError:
            gagal.append(f"{nama}: tanggal_cek bukan TTTT-BB-HH")
        halaman = DOCS / a["halaman"]
        if not (halaman.is_file() or (halaman / "index.html").is_file()):
            gagal.append(f"{nama}: halaman {a['halaman']} tidak ada")
        for b in a["skrip"] + a["uji"] + ([a["sub_daftar"]] if "sub_daftar" in a else []):
            if not (AKAR / b).is_file():
                gagal.append(f"{nama}: berkas {b} tidak ada")
        if not a["uji"] or not all(re.fullmatch(r"tests/verifikasi_[a-z0-9_]+\.py", u) for u in a["uji"]):
            gagal.append(f"{nama}: uji harus berupa tests/verifikasi_*.py")
        if not [s for s in a["sumber"] if s.strip()]:
            gagal.append(f"{nama}: sumber kosong")
        if a["status"] == "asli":
            teks = [(AKAR / u).read_text(encoding="utf-8") for u in a["uji"] if (AKAR / u).is_file()]
            if not any("CONTOH-BUKU" in t and "DILEWATI  contoh soal buku" not in t for t in teks):
                gagal.append(f"{nama}: status asli wajib punya uji contoh soal buku (penanda CONTOH-BUKU)")

    terdaftar = {a["halaman"] for a in reg["alat"]}
    for h in sorted((DOCS / "kalkulator").glob("*.html")):
        if h.relative_to(DOCS).as_posix() not in terdaftar:
            gagal.append(f"{h.relative_to(AKAR)} belum terdaftar di konten/alat.json")

    for g in gagal:
        print("GAGAL ", g)
    print(f"{len(reg['alat'])} alat diperiksa.")
    print("\nSemua cocok." if not gagal else f"\n{len(gagal)} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
