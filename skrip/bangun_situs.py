"""Bangun halaman situs dari tulisan di konten/ dan seragamkan menu serta footer.

Yang dilakukan:
1. Setiap berkas Markdown di konten/ diubah menjadi halaman HTML di docs/ dengan
   templat yang sama (menu, gaya, footer, tag pratinjau).
2. Daftar catatan dibuat otomatis (docs/catatan/) dan disisipkan ke beranda.
3. Menu dan footer di semua halaman docs/ (termasuk yang ditulis tangan) ditulis ulang
   di antara penanda <!-- NAV:MULAI --> … <!-- NAV:SELESAI --> dan <!-- FOOTER:MULAI --> …
   <!-- FOOTER:SELESAI -->, supaya selalu seragam.
4. sitemap.xml dan robots.txt dibuat ulang.

Pemakaian (dari akar repo):
  python3 skrip/bangun_situs.py            tulis ulang berkas
  python3 skrip/bangun_situs.py --periksa  hanya periksa; gagal bila ada berkas yang belum dibangun ulang

Membutuhkan paket Python "markdown" (lihat skrip/kebutuhan.txt).
"""
import html
import os
import re
import sys
from pathlib import Path

import markdown

AKAR = Path(__file__).resolve().parent.parent
KONTEN, DOCS = AKAR / "konten", AKAR / "docs"
SITUS = "https://defsayurinda-bot.github.io/Defsa-Yurinda/"
REPO = "https://github.com/defsayurinda-bot/Defsa-Yurinda"
DASAR_404 = "/Defsa-Yurinda/"

MENU = [("alat/", "Alat", ("alat", "kalkulator")),
        ("latihan/", "Latihan", ("latihan",)),
        ("catatan/", "Catatan", ("catatan",)),
        ("tentang/", "Tentang", ("tentang", "cara-memakai-ai", "skill"))]


# ---------------------------------------------------------------- peta sumber → halaman

def peta_halaman():
    """Kembalikan daftar (berkas sumber, folder keluaran relatif terhadap docs/)."""
    peta = [(KONTEN / "tentang.md", "tentang/")]
    for bagian in ("cara-memakai-ai", "skill"):
        for f in sorted((KONTEN / bagian).glob("*.md")):
            peta.append((f, f"{bagian}/" if f.name == "README.md" else f"{bagian}/{f.stem}/"))
    for f in sorted((KONTEN / "catatan").glob("*.md")):
        peta.append((f, f"catatan/{f.stem}/"))
    return peta


def kedalaman(folder):
    return folder.strip("/").count("/") + 1 if folder.strip("/") else 0


def relatif(dari_folder, ke):
    return "../" * kedalaman(dari_folder) + ke


# ---------------------------------------------------------------- bagian bersama

def menu(awalan, aktif):
    tanda = ' aria-current="page"'
    butir = "".join(f'<li><a href="{awalan}{url}"{tanda if aktif in kunci else ""}>{nama}</a></li>'
                    for url, nama, kunci in MENU)
    return (f'<nav class="nav">\n    <div class="wadah">\n      <a class="merek" href="{awalan or "./"}">Defsa<span>.</span></a>\n'
            f'      <ul>{butir}</ul>\n    </div>\n  </nav>')


def footer(awalan, sumber=None):
    tautan_sumber = f' · <a href="{REPO}/blob/main/{sumber}">Sumber halaman ini</a>' if sumber else ""
    return ('<footer>\n    <div class="wadah">'
            f'<a href="{awalan or "./"}">Defsa Yurinda</a> · Teknik Sipil, Universitas Jambi · '
            f'<a href="{REPO}">Kode dan tulisan di GitHub</a>{tautan_sumber} · '
            f'Isi dilisensikan <a href="{REPO}/blob/main/LICENSE">CC BY 4.0</a></div>\n  </footer>')


def bagian_aktif(folder):
    return folder.strip("/").split("/")[0] if folder.strip("/") else ""


# ---------------------------------------------------------------- Markdown → HTML

def judul_dan_ringkasan(teks):
    judul = re.search(r"^# (.+)$", teks, re.M).group(1).strip()
    ringkasan = ""
    for par in re.split(r"\n\s*\n", teks):
        par = par.strip()
        if not par or par.startswith(("#", "|", "-", "*", ">", "```", "<")) or re.match(r"^\d+\.", par):
            continue
        ringkasan = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", par)
        ringkasan = re.sub(r"<[^>]+>|[*`_]", "", ringkasan).replace("\n", " ")
        break
    if len(ringkasan) > 180:
        ringkasan = ringkasan[:177].rsplit(" ", 1)[0] + "…"
    return judul, ringkasan


def tulis_ulang_tautan(isi_html, sumber, folder, peta):
    ke_url = {s.resolve(): f for s, f in peta}

    def ganti(m):
        href = m.group(1)
        if re.match(r"^(https?:|mailto:|#)", href):
            return m.group(0)
        jalur, _, jangkar = href.partition("#")
        target = (sumber.parent / jalur).resolve()
        if target in ke_url:
            baru = relatif(folder, ke_url[target])
        else:
            baru = f"{REPO}/blob/main/{target.relative_to(AKAR).as_posix()}"
        return f'href="{baru}{"#" + jangkar if jangkar else ""}"'

    return re.sub(r'href="([^"]+)"', ganti, isi_html)


def kepala(judul, ringkasan, awalan, url):
    j, r = html.escape(judul), html.escape(ringkasan)
    return f"""<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{j} · Defsa Yurinda</title>
  <meta name="description" content="{r}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{j} · Defsa Yurinda">
  <meta property="og:description" content="{r}">
  <meta property="og:url" content="{SITUS}{url}">
  <meta property="og:image" content="{SITUS}assets/pratinjau.png">
  <meta property="og:locale" content="id_ID">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#c8421a">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{awalan}assets/gaya.css">
  <link rel="icon" href="{awalan}assets/ikon.svg" type="image/svg+xml">
</head>"""


def halaman_konten(sumber, folder, peta, sebelum=None, sesudah=None):
    teks = sumber.read_text(encoding="utf-8")
    judul, ringkasan = judul_dan_ringkasan(teks)
    isi = markdown.markdown(teks, extensions=["tables", "fenced_code", "sane_lists"], output_format="html")
    isi = tulis_ulang_tautan(isi, sumber, folder, peta)
    awalan = "../" * kedalaman(folder)
    aktif = bagian_aktif(folder)
    if aktif == "catatan":
        atas = ("catatan/", "Semua catatan")
    elif aktif == "tentang" or folder in ("cara-memakai-ai/", "skill/"):
        atas = ("tentang/", "Tentang") if aktif != "tentang" else ("", "Beranda")
    else:
        atas = (f"{aktif}/", {"cara-memakai-ai": "Cara saya memakai AI", "skill": "Skill Claude"}[aktif])
    remah = f'<p class="remah"><a href="{awalan}{atas[0]}">← {atas[1]}</a></p>'
    navigasi = ""
    if sebelum or sesudah:
        kiri = f'<a class="tombol" href="{relatif(folder, sebelum[1])}">← {html.escape(sebelum[0])}</a>' if sebelum else "<span></span>"
        kanan = f'<a class="tombol" href="{relatif(folder, sesudah[1])}">{html.escape(sesudah[0])} →</a>' if sesudah else "<span></span>"
        navigasi = f'\n      <div class="berikut">{kiri}{kanan}</div>'
    return (kepala(judul, ringkasan, awalan, folder) + "\n<body>\n  <!-- NAV:MULAI -->\n  " + menu(awalan, aktif) +
            "\n  <!-- NAV:SELESAI -->\n\n  <main class=\"wadah\">\n    <article class=\"prosa\">\n      " + remah + "\n" +
            isi + navigasi + "\n    </article>\n  </main>\n\n  <!-- FOOTER:MULAI -->\n  " +
            footer(awalan, sumber.relative_to(AKAR).as_posix()) + "\n  <!-- FOOTER:SELESAI -->\n</body>\n</html>\n")


def daftar_catatan(peta):
    hasil = []
    for sumber, folder in peta:
        if folder.startswith("catatan/"):
            judul, ringkasan = judul_dan_ringkasan(sumber.read_text(encoding="utf-8"))
            nomor, _, nama = judul.partition(" — ")
            hasil.append((nomor, nama or judul, ringkasan, folder))
    return hasil


def halaman_daftar_catatan(catatan):
    folder, awalan = "catatan/", "../"
    butir = "\n".join(
        f'        <li><a href="{relatif(folder, f)}"><strong>{html.escape(n)}</strong> · {html.escape(j)}</a>'
        f'<br><span class="kecil redup">{html.escape(r)}</span></li>' for n, j, r, f in reversed(catatan))
    return (kepala("Catatan belajar", "Catatan saya selama belajar Git, GitHub, dan Claude Code untuk kuliah teknik sipil.", awalan, folder) +
            "\n<body>\n  <!-- NAV:MULAI -->\n  " + menu(awalan, "catatan") + "\n  <!-- NAV:SELESAI -->\n\n"
            "  <main class=\"wadah\">\n    <header class=\"pahlawan\" style=\"padding-bottom:16px\">\n"
            "      <span class=\"label-atas\">Catatan</span>\n      <h1>Catatan belajar</h1>\n"
            "      <p class=\"lead\">Catatan saya selama belajar Git, GitHub, dan Claude Code. Setiap catatan berisi konsep, contoh dari pengalaman sendiri, dan latihan.</p>\n"
            "    </header>\n    <div class=\"kartu\">\n      <ul class=\"daftar-bersih\">\n" + butir +
            "\n      </ul>\n    </div>\n  </main>\n\n  <!-- FOOTER:MULAI -->\n  " + footer(awalan) +
            "\n  <!-- FOOTER:SELESAI -->\n</body>\n</html>\n")


# ---------------------------------------------------------------- penanda di halaman tulisan tangan

def ganti_penanda(teks, nama, isi, wajib=True):
    pola = re.compile(rf"(<!-- {nama}:MULAI -->)(.*?)(<!-- {nama}:SELESAI -->)", re.S)
    if not pola.search(teks):
        if wajib:
            raise SystemExit(f"Penanda {nama} tidak ditemukan")
        return teks
    return pola.sub(lambda m: f"{m.group(1)}\n  {isi}\n  {m.group(3)}", teks)


def seragamkan(berkas, teks):
    rel = berkas.relative_to(DOCS).as_posix()
    if rel == "404.html":
        awalan, aktif = DASAR_404, ""
    else:
        folder = rel.rsplit("/", 1)[0] + "/" if "/" in rel else ""
        awalan, aktif = "../" * kedalaman(folder), bagian_aktif(folder)
    teks = ganti_penanda(teks, "NAV", menu(awalan, aktif))
    return ganti_penanda(teks, "FOOTER", footer(awalan), wajib=False)


def sisip_catatan_beranda(teks, catatan):
    butir = "\n".join(f'          <li><a href="{f}"><strong>{html.escape(n)}</strong> · {html.escape(j)}</a></li>'
                      for n, j, _, f in list(reversed(catatan))[:3])
    return ganti_penanda(teks, "CATATAN", f'<ul class="daftar-bersih">\n{butir}\n        </ul>')


def sitemap(berkas_html):
    url = sorted(SITUS + (p.relative_to(DOCS).as_posix().removesuffix("index.html"))
                 for p in berkas_html if p.name != "404.html")
    isi = "\n".join(f"  <url><loc>{u}</loc></url>" for u in url)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{isi}\n</urlset>\n'


# ---------------------------------------------------------------- utama

def bangun():
    """Kembalikan {jalur: isi} untuk semua berkas yang seharusnya ada."""
    peta = peta_halaman()
    catatan = daftar_catatan(peta)
    keluaran = {}
    urutan_catatan = [(f"{n} · {j}", f) for n, j, _, f in catatan]
    for sumber, folder in peta:
        sebelum = sesudah = None
        if folder.startswith("catatan/"):
            i = [f for _, f in urutan_catatan].index(folder)
            sebelum = urutan_catatan[i - 1] if i > 0 else None
            sesudah = urutan_catatan[i + 1] if i + 1 < len(urutan_catatan) else None
        keluaran[DOCS / folder / "index.html"] = halaman_konten(sumber, folder, peta, sebelum, sesudah)
    keluaran[DOCS / "catatan/index.html"] = halaman_daftar_catatan(catatan)

    dihasilkan = set(keluaran)
    for berkas in sorted(DOCS.rglob("*.html")):
        if berkas in dihasilkan:
            continue
        teks = seragamkan(berkas, berkas.read_text(encoding="utf-8"))
        if berkas == DOCS / "index.html":
            teks = sisip_catatan_beranda(teks, catatan)
        keluaran[berkas] = teks
    semua_html = set(keluaran) | set(DOCS.rglob("*.html"))
    keluaran[DOCS / "sitemap.xml"] = sitemap(semua_html)
    keluaran[DOCS / "robots.txt"] = f"User-agent: *\nAllow: /\nSitemap: {SITUS}sitemap.xml\n"
    return keluaran


def main():
    periksa = "--periksa" in sys.argv
    berubah = []
    for jalur, isi in bangun().items():
        lama = jalur.read_text(encoding="utf-8") if jalur.exists() else None
        if lama != isi:
            berubah.append(jalur.relative_to(AKAR).as_posix())
            if not periksa:
                jalur.parent.mkdir(parents=True, exist_ok=True)
                jalur.write_text(isi, encoding="utf-8")
    if periksa and berubah:
        print("Situs belum dibangun ulang. Jalankan: python3 skrip/bangun_situs.py\n  " + "\n  ".join(berubah))
        sys.exit(1)
    print(("Berkas diperbarui:\n  " + "\n  ".join(berubah)) if berubah and not periksa else "Situs sudah sesuai dengan konten/.")


if __name__ == "__main__":
    os.chdir(AKAR)
    main()
