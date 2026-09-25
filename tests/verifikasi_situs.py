"""Verifikasi fitur situs Tahap 7: tanpa CDN, mode offline, pencarian, dan lencana status.

1. Tidak ada halaman yang memuat KaTeX atau huruf dari CDN; semua aset lokal.
2. Setiap halaman memuat manifest dan pendaftar service worker; versi cache di docs/sw.js sama
   dengan versi di CITATION.cff; semua aset inti yang disimpan saat pemasangan ada.
3. Indeks docs/cari.json memuat setiap alat di registri, setiap alat praktikum, dan setiap catatan,
   dan setiap URL-nya menunjuk ke berkas yang ada.
4. Setiap halaman alat di registri menampilkan lencana status sumber.

Jalankan dari akar repo:  python3 tests/verifikasi_situs.py
"""
import json
import re
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
DOCS = AKAR / "docs"


def berkas_url(u):
    f = DOCS / u
    return f / "index.html" if u.endswith("/") or u == "" else f


def main():
    gagal = []
    halaman = sorted(DOCS.rglob("*.html"))

    for f in halaman:
        t = f.read_text(encoding="utf-8")
        nama = f.relative_to(AKAR)
        if re.search(r"cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|cdnjs", t):
            gagal.append(f"{nama}: masih memuat aset dari CDN")
        if 'rel="manifest"' not in t:
            gagal.append(f"{nama}: tanpa manifest")
        if "daftar-sw.js" not in t:
            gagal.append(f"{nama}: tanpa pendaftar service worker")
        for m in re.finditer(r'(?:src|href)="([^"#?]+\.(?:js|css|woff2))"', t):
            jalur = m.group(1)
            if jalur.startswith("http"):
                continue
            target = DOCS / jalur.lstrip("/") if jalur.startswith("/") else (f.parent / jalur).resolve()
            if not target.exists():
                gagal.append(f"{nama}: aset {jalur} tidak ada")

    versi = re.search(r"^version:\s*(\S+)", (AKAR / "CITATION.cff").read_text(encoding="utf-8"), re.M).group(1)
    sw = (DOCS / "sw.js").read_text(encoding="utf-8")
    if f'const VERSI = "defsa-{versi}";' not in sw:
        gagal.append(f"docs/sw.js: versi cache tidak sama dengan CITATION.cff ({versi})")
    inti = json.loads("[" + re.search(r"const INTI = \[(.*?)\];", sw, re.S).group(1) + "]")
    for u in inti:
        if not berkas_url(u.lstrip("/")).exists():
            gagal.append(f"docs/sw.js: aset inti {u} tidak ada")
    manifest = json.loads((DOCS / "manifest.webmanifest").read_text(encoding="utf-8"))
    for k in ("name", "short_name", "start_url", "icons"):
        if k not in manifest:
            gagal.append(f"manifest: kolom {k} hilang")
    for ik in manifest.get("icons", []):
        if not (DOCS / ik["src"].lstrip("/")).exists():
            gagal.append(f"manifest: ikon {ik['src']} tidak ada")

    indeks = json.loads((DOCS / "cari.json").read_text(encoding="utf-8"))
    url = {x["u"] for x in indeks}
    for x in indeks:
        if not berkas_url(x["u"]).exists():
            gagal.append(f"cari.json: {x['u']} tidak ada")
    registri = json.loads((AKAR / "konten/alat.json").read_text(encoding="utf-8"))
    praktikum = json.loads((AKAR / "konten/praktikum.json").read_text(encoding="utf-8"))
    wajib = [a["halaman"] for a in registri["alat"]]
    wajib += [f"praktikum/{a['id']}/" for k in praktikum["kelompok"] for a in k["alat"] if a["status"] == "tersedia"]
    wajib += [f"catatan/{c.stem}/" for c in sorted((AKAR / "konten/catatan").glob("*.md"))]
    for u in wajib:
        if u not in url:
            gagal.append(f"cari.json: {u} belum terindeks")

    for a in registri["alat"]:
        if "Status sumber:" not in berkas_url(a["halaman"]).read_text(encoding="utf-8"):
            gagal.append(f"{a['halaman']}: lencana status sumber tidak ada")

    for g in gagal:
        print("GAGAL ", g)
    print(f"{len(halaman)} halaman, {len(indeks)} entri indeks diperiksa.")
    print("\nSemua cocok." if not gagal else f"\n{len(gagal)} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
