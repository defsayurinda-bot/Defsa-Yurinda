"""Verifikasi tautan situs.

1. Setiap tautan internal (href/src) di docs/ menunjuk ke berkas yang ada.
2. Setiap tautan ke berkas di repo ini (github.com/.../blob/main/...) menunjuk ke berkas yang ada.
3. Tautan ke konten di README.md dan konten/ tidak rusak.
4. Tidak ada rujukan ke jalur lama yang sudah dipindahkan.

Jalankan dari akar repo:  python3 tests/verifikasi_tautan.py
"""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

AKAR = Path(__file__).resolve().parent.parent
DOCS = AKAR / "docs"
BLOB = "https://github.com/defsayurinda/defsayurinda.github.io/blob/main/"
TREE = "https://github.com/defsayurinda/defsayurinda.github.io/tree/main/"
JALUR_LAMA = ("tentang-saya.md", "cara-saya-memakai-claude/", "/blob/main/catatan/", "/blob/main/skill/")


def cek_berkas_repo(url):
    jalur = unquote(url.split("#")[0].replace(BLOB, "").replace(TREE, ""))
    return (AKAR / jalur).exists()


def main():
    gagal = []
    jumlah = 0
    for berkas in sorted(DOCS.rglob("*.html")):
        teks = berkas.read_text(encoding="utf-8")
        for url in re.findall(r'(?:href|src)="([^"]+)"', teks):
            if url.startswith(("#", "mailto:", "data:")):
                continue
            jumlah += 1
            if url.startswith((BLOB, TREE)):
                if not cek_berkas_repo(url):
                    gagal.append(f"{berkas.relative_to(AKAR)}: {url}")
                continue
            if re.match(r"^https?://", url):
                continue
            jalur = url.split("#")[0].split("?")[0]
            if berkas.name == "404.html" and jalur.startswith("/"):
                target = DOCS / jalur.removeprefix("/")
            else:
                target = (berkas.parent / jalur).resolve()
            if target.is_dir():
                target = target / "index.html"
            if not target.exists():
                gagal.append(f"{berkas.relative_to(AKAR)}: {url}")

    for berkas in [AKAR / "README.md", *sorted((AKAR / "konten").rglob("*.md"))]:
        for url in re.findall(r"\]\(([^)]+)\)", berkas.read_text(encoding="utf-8")):
            if url.startswith(("http", "#", "mailto:")):
                continue
            jumlah += 1
            if not (berkas.parent / url.split("#")[0]).exists():
                gagal.append(f"{berkas.relative_to(AKAR)}: {url}")

    for berkas in [*DOCS.rglob("*.html"), AKAR / "README.md", *(AKAR / "konten").rglob("*.md")]:
        teks = berkas.read_text(encoding="utf-8")
        for lama in JALUR_LAMA:
            if lama in teks:
                gagal.append(f"{berkas.relative_to(AKAR)}: masih merujuk jalur lama '{lama}'")

    for g in gagal:
        print("GAGAL ", g)
    print(f"{jumlah} tautan diperiksa.")
    print("\nSemua cocok." if not gagal else f"\n{len(gagal)} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
