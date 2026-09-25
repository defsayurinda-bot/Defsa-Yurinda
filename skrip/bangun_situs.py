"""Bangun halaman situs dari tulisan di konten/ dan seragamkan menu serta footer.

Yang dilakukan:
1. Setiap berkas Markdown di konten/ diubah menjadi halaman HTML di docs/ dengan
   templat yang sama (menu, gaya, footer, tag pratinjau).
2. Daftar catatan dibuat otomatis (docs/catatan/) dan disisipkan ke beranda.
   Kartu alat di beranda, daftar di halaman Alat, dan tabel alat di README.md dibangun
   dari registri konten/alat.json (penanda ALAT dan DAFTAR-ALAT).
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
import json
import os
import re
import sys
from pathlib import Path

import markdown

AKAR = Path(__file__).resolve().parent.parent
KONTEN, DOCS = AKAR / "konten", AKAR / "docs"
SITUS = "https://defsayurinda.github.io/"
REPO = "https://github.com/defsayurinda/defsayurinda.github.io"
DASAR_404 = "/"

MENU = [("alat/", "Alat", ("alat", "kalkulator", "praktikum")),
        ("latihan/", "Latihan", ("latihan",)),
        ("catatan/", "Catatan", ("catatan",)),
        ("tentang/", "Tentang", ("tentang", "cara-memakai-ai", "skill")),
        ("cari/", "Cari", ("cari",))]


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


def skrip_sw(awalan):
    return f'\n  <script src="{awalan}assets/daftar-sw.js" defer></script>'


def footer(awalan, sumber=None):
    tautan_sumber = f' · <a href="{REPO}/blob/main/{sumber}">Sumber halaman ini</a>' if sumber else ""
    return ('<footer>\n    <div class="wadah">'
            f'<a href="{awalan or "./"}">Defsa Yurinda</a> · Teknik Sipil, Universitas Jambi · '
            f'<a href="{REPO}">Kode dan tulisan di GitHub</a>{tautan_sumber} · '
            f'Kode <a href="{REPO}/blob/main/LICENSE">MIT</a>, tulisan <a href="{REPO}/blob/main/LICENSE-TULISAN">CC BY 4.0</a></div>\n  </footer>' + skrip_sw(awalan))


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


def kepala(judul, ringkasan, awalan, url, tambahan=""):
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
  <link rel="stylesheet" href="{awalan}assets/gaya.css">
  <link rel="icon" href="{awalan}assets/ikon.svg" type="image/svg+xml">
  <link rel="manifest" href="{awalan}manifest.webmanifest">{tambahan}
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


# ---------------------------------------------------------------- praktikum

def katex_css(awalan):
    return f'\n  <link rel="stylesheet" href="{awalan}assets/katex/katex.min.css">'


def data_praktikum():
    return json.loads((KONTEN / "praktikum.json").read_text(encoding="utf-8"))


def halaman_alat_praktikum(alat, kelompok, status=""):
    folder = f"praktikum/{alat['id']}/"
    awalan = "../../"
    skrip = "".join(f'\n  <script src="{awalan}assets/praktikum/{s}" defer></script>'
                    for s in dict.fromkeys(["grafik.js", "ekspor.js", "kerangka.js"] + alat["skrip"]))
    return (kepala(f"{alat['judul']} · Praktikum", alat["deskripsi"], awalan, folder, katex_css(awalan)) +
            "\n<body>\n  <!-- NAV:MULAI -->\n  " + menu(awalan, "praktikum") + "\n  <!-- NAV:SELESAI -->\n\n"
            "  <main class=\"wadah\">\n    <header class=\"pahlawan\" style=\"padding-bottom:16px\">\n"
            f"      <p class=\"remah\"><a href=\"{awalan}praktikum/\">← Praktikum Mekanika Tanah</a></p>\n"
            f"      <span class=\"label-atas\">{html.escape(kelompok)} · {html.escape(alat['standar'])}</span>\n"
            f"      <h1>{html.escape(alat['judul'])}</h1>\n      <p class=\"lead\">{html.escape(alat['deskripsi'])}</p>\n      {status}\n    </header>\n"
            f"    <div id=\"alat-praktikum\" data-alat=\"{alat['id']}\"></div>\n  </main>\n\n"
            "  <!-- FOOTER:MULAI -->\n  " + footer(awalan) + "\n  <!-- FOOTER:SELESAI -->\n"
            f'  <script src="{awalan}assets/katex/katex.min.js" defer></script>\n'
            f'  <script src="{awalan}assets/umum.js" defer></script>{skrip}\n</body>\n</html>\n')


def halaman_induk_praktikum(data, status=""):
    folder, awalan = "praktikum/", "../"
    bagian = []
    for k in data["kelompok"]:
        kartu = []
        for a in k["alat"]:
            isi = (f'<span class="lencana">{html.escape(a["standar"])}</span>\n          <h3>{html.escape(a["judul"])}</h3>\n'
                   f'          <p class="redup">{html.escape(a["deskripsi"])}</p>')
            if a["status"] == "tersedia":
                kartu.append(f'        <a class="kartu" href="{a["id"]}/">\n          {isi}\n        </a>')
            else:
                kartu.append(f'        <div class="kartu kartu-menyusul">\n          {isi}\n          <p class="kecil"><strong>Menyusul</strong></p>\n        </div>')
        bagian.append(f'    <section>\n      <h2>{html.escape(k["judul"])}</h2>\n      <div class="kisi">\n' + "\n".join(kartu) + "\n      </div>\n    </section>")
    tersedia = sum(a["status"] == "tersedia" for k in data["kelompok"] for a in k["alat"])
    semua = sum(len(k["alat"]) for k in data["kelompok"])
    status_alat = (f"Semua {semua} alat sudah tersedia, dari sifat fisik sampai uji lapangan." if tersedia == semua
                   else f"{tersedia} dari {semua} alat sudah tersedia; alat lain menyusul.")
    return (kepala("Praktikum Mekanika Tanah", f"{semua} alat pengolah data praktikum Mekanika Tanah: formulir seperti lembar data laboratorium, langkah hitungan, grafik, dan ekspor ke Word dan Excel.", awalan, folder) +
            "\n<body>\n  <!-- NAV:MULAI -->\n  " + menu(awalan, "praktikum") + "\n  <!-- NAV:SELESAI -->\n\n"
            "  <main class=\"wadah\">\n    <header class=\"pahlawan\" style=\"padding-bottom:16px\">\n"
            "      <span class=\"label-atas\">Praktikum</span>\n      <h1>Praktikum Mekanika Tanah</h1>\n"
            f"      <p class=\"lead\">Pengolah data praktikum dengan formulir seperti lembar data laboratorium. {status_alat}</p>\n"
            f"      {status}\n    </header>\n    <div class=\"kisi kisi-2 fitur\">\n"
            "      <div class=\"kartu\"><h3>Isi seperti form lab</h3><p class=\"redup\">Baris dan simbol mengikuti lembar data. Angka boleh diketik dengan koma, atau blok data di Excel lalu tempel sekaligus.</p></div>\n"
            "      <div class=\"kartu\"><h3>Langkah dan grafik</h3><p class=\"redup\">Setiap hasil disertai rumus bernomor, substitusi angka, dan grafik yang dibutuhkan laporan.</p></div>\n"
            "      <div class=\"kartu\"><h3>Saling terhubung</h3><p class=\"redup\">Hasil satu alat bisa diambil alat lain: G<sub>s</sub> ke pemadatan, hidrometer, dan konsolidasi; saringan, hidrometer, dan Atterberg ke klasifikasi; γ<sub>d maks</sub> ke sand cone dan CBR.</p></div>\n"
            "      <div class=\"kartu\"><h3>Siap untuk laporan</h3><p class=\"redup\">Unduh Word dengan Times New Roman dan tabel tanpa garis vertikal, grafik PNG, salin ke Excel, atau cetak dengan kop identitas contoh.</p></div>\n"
            "    </div>\n" + "\n".join(bagian) +
            "\n    <section>\n      <div class=\"catatan\"><strong>Untuk laporan.</strong> Alat ini membantu mengolah dan memeriksa data. Ikuti modul dan arahan asisten laboratorium untuk format laporan resmi, termasuk bila perhitungan harus ditulis tangan.</div>\n    </section>\n  </main>\n\n"
            "  <!-- FOOTER:MULAI -->\n  " + footer(awalan) + "\n  <!-- FOOTER:SELESAI -->\n</body>\n</html>\n")


# ---------------------------------------------------------------- registri alat

def data_alat():
    return json.loads((KONTEN / "alat.json").read_text(encoding="utf-8"))


def kartu_beranda(data):
    kartu = []
    for a in data["alat"]:
        kartu.append(f'<a class="kartu" href="{a["halaman"]}">\n          <span class="lencana">{html.escape(a["lencana"])}</span>\n'
                     f'          <h3>{html.escape(a["judul"])}</h3>\n          <p class="redup">{a["ringkas"]}</p>\n        </a>')
    return "\n        ".join(kartu)


def daftar_halaman_alat(data):
    bagian = []
    for k in data["kategori"]:
        kartu = []
        for a in (x for x in data["alat"] if x["kategori"] == k["id"]):
            rincian = "".join(f"\n            <dt>{html.escape(dt)}</dt><dd>{dd}</dd>" for dt, dd in a["rincian"])
            kartu.append(f'        <a class="kartu" href="../{a["halaman"]}">\n'
                         f'          <span class="lencana">{html.escape(a.get("lencana_rincian", a["lencana"]))}</span>\n'
                         f'          <h3>{html.escape(a.get("judul_rincian", a["judul"]))}</h3>\n'
                         f'          <dl class="rincian">{rincian}\n          </dl>\n        </a>')
        if kartu:
            bagian.append(f'<section>\n      <h2>{html.escape(k["judul"])}</h2>\n      <div class="kisi">\n' + "\n".join(kartu) + "\n      </div>\n    </section>")
    return "\n\n    ".join(bagian)


STATUS = {"asli": "Sumber asli", "sekunder": "Sumber sekunder", "belum": "Belum terverifikasi"}
BULAN = "Januari Februari Maret April Mei Juni Juli Agustus September Oktober November Desember".split()


def lencana_status(a):
    t, b, h = (int(x) for x in a["tanggal_cek"].split("-"))
    return (f'<p class="status-sumber" data-status="{a["status"]}">Status sumber: <strong>{STATUS[a["status"]]}</strong> · '
            f'dicek {h} {BULAN[b - 1]} {t} · <a href="{REPO}#alat">arti status</a></p>')


def tabel_readme(data):
    baris = [f'| [{a["judul_pendek"]}]({SITUS}{a["halaman"]}) | {a["deskripsi"]} | {STATUS[a["status"]]} |' for a in data["alat"]]
    return "| Alat | Isi | Status sumber |\n|---|---|---|\n" + "\n".join(baris)


# ---------------------------------------------------------------- penanda di halaman tulisan tangan

def ganti_penanda(teks, nama, isi, wajib=True, baris_baru=False):
    pola = re.compile(rf"(<!-- {nama}:MULAI -->)(.*?)(<!-- {nama}:SELESAI -->)", re.S)
    if not pola.search(teks):
        if wajib:
            raise SystemExit(f"Penanda {nama} tidak ditemukan")
        return teks
    if baris_baru:  # Markdown: tabel harus mulai di awal baris
        return pola.sub(lambda m: f"{m.group(1)}\n{isi}\n{m.group(3)}", teks)
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


# ---------------------------------------------------------------- pencarian

def subjudul(teks):
    return " ".join(re.sub(r"[*`_]", "", m) for m in re.findall(r"^#{2,3} (.+)$", teks, re.M))


def indeks_cari(peta, catatan, alat, praktikum):
    butir = [{"j": a["judul"], "d": a["deskripsi"], "h": " ".join(dd for _, dd in a["rincian"]), "u": a["halaman"], "k": "Alat"}
             for a in alat["alat"]]
    for k in praktikum["kelompok"]:
        for a in k["alat"]:
            if a["status"] == "tersedia":
                butir.append({"j": a["judul"], "d": a["deskripsi"], "h": f'{k["judul"]} {a["standar"]}', "u": f'praktikum/{a["id"]}/', "k": "Praktikum"})
    for sumber, folder in peta:
        teks = sumber.read_text(encoding="utf-8")
        judul, ringkasan = judul_dan_ringkasan(teks)
        jenis = "Catatan" if folder.startswith("catatan/") else "Tulisan"
        butir.append({"j": judul, "d": ringkasan, "h": subjudul(teks), "u": folder, "k": jenis})
    for x in butir:
        x["h"] = re.sub(r"<[^>]+>", "", x["h"])
    return json.dumps(butir, ensure_ascii=False, indent=0) + "\n"


def halaman_cari():
    folder, awalan = "cari/", "../"
    return (kepala("Cari", "Cari alat, alat praktikum, catatan, dan tulisan di situs Defsa Yurinda.", awalan, folder) +
            "\n<body>\n  <!-- NAV:MULAI -->\n  " + menu(awalan, "cari") + "\n  <!-- NAV:SELESAI -->\n\n"
            "  <main class=\"wadah\">\n    <header class=\"pahlawan\" style=\"padding-bottom:16px\">\n"
            "      <h1>Cari</h1>\n    </header>\n"
            "    <form class=\"kartu\" role=\"search\" onsubmit=\"return false\">\n"
            "      <label for=\"kataCari\">Kata yang dicari</label>\n"
            "      <input id=\"kataCari\" type=\"search\" autocomplete=\"off\" placeholder=\"misalnya konsolidasi, CBR, git\">\n"
            "    </form>\n    <p id=\"infoCari\" class=\"kecil redup\" role=\"status\" aria-live=\"polite\"></p>\n"
            "    <ul id=\"hasilCari\" class=\"daftar-bersih hasil-cari\"></ul>\n  </main>\n\n"
            "  <!-- FOOTER:MULAI -->\n  " + footer(awalan) + "\n  <!-- FOOTER:SELESAI -->\n"
            f'  <script src="{awalan}assets/cari.js" defer></script>\n</body>\n</html>\n')


# ---------------------------------------------------------------- mode offline

INTI = ["assets/gaya.css", "assets/umum.js", "assets/daftar-sw.js", "assets/ikon.svg", "manifest.webmanifest",
        "assets/katex/katex.min.css", "assets/katex/katex.min.js",
        "assets/font/plus-jakarta-sans-latin-400-normal.woff2", "assets/font/plus-jakarta-sans-latin-600-normal.woff2",
        "assets/font/plus-jakarta-sans-latin-700-normal.woff2", "assets/font/plus-jakarta-sans-latin-800-normal.woff2"]


def versi_rilis():
    return re.search(r"^version:\s*(\S+)", (AKAR / "CITATION.cff").read_text(encoding="utf-8"), re.M).group(1)


def service_worker():
    inti = ",\n  ".join(json.dumps("/" + x) for x in ["", *INTI])
    return f"""/* Dibangun oleh skrip/bangun_situs.py; jangan diedit langsung.
 * Versi cache mengikuti versi di CITATION.cff. Aset inti disimpan saat pemasangan; halaman dan
 * aset lain disimpan saat pertama dibuka. Halaman: jaringan dulu, cadangan dari cache. Aset: cache dulu.
 */
const VERSI = "defsa-{versi_rilis()}";
const INTI = [
  {inti}
];

self.addEventListener("install", (e) => {{
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(INTI)).then(() => self.skipWaiting()));
}});

self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys()
    .then((kunci) => Promise.all(kunci.filter((k) => k !== VERSI).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
}});

self.addEventListener("fetch", (e) => {{
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const simpan = (res) => {{
    if (res.ok) {{ const salinan = res.clone(); caches.open(VERSI).then((c) => c.put(req, salinan)); }}
    return res;
  }};
  if (req.mode === "navigate") {{
    e.respondWith(fetch(req).then(simpan).catch(() => caches.match(req)));
    return;
  }}
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then(simpan)));
}});
"""


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
    praktikum = data_praktikum()
    alat = data_alat()
    status_praktikum = lencana_status(next(a for a in alat["alat"] if a["id"] == "praktikum"))
    keluaran[DOCS / "praktikum/index.html"] = halaman_induk_praktikum(praktikum, status_praktikum)
    for k in praktikum["kelompok"]:
        for a in k["alat"]:
            if a["status"] == "tersedia":
                keluaran[DOCS / f"praktikum/{a['id']}/index.html"] = halaman_alat_praktikum(a, k["judul"], status_praktikum)

    dihasilkan = set(keluaran)
    for berkas in sorted(DOCS.rglob("*.html")):
        if berkas in dihasilkan:
            continue
        teks = seragamkan(berkas, berkas.read_text(encoding="utf-8"))
        if berkas == DOCS / "index.html":
            teks = sisip_catatan_beranda(teks, catatan)
        keluaran[berkas] = teks
    for a in alat["alat"]:
        target = DOCS / a["halaman"]
        target = target / "index.html" if a["halaman"].endswith("/") else target
        if target in keluaran:
            keluaran[target] = ganti_penanda(keluaran[target], "STATUS", lencana_status(a), wajib=False)
    keluaran[DOCS / "cari.json"] = indeks_cari(peta, catatan, alat, praktikum)
    keluaran[DOCS / "cari/index.html"] = halaman_cari()
    keluaran[DOCS / "index.html"] = ganti_penanda(keluaran[DOCS / "index.html"], "ALAT", kartu_beranda(alat))
    keluaran[DOCS / "alat/index.html"] = ganti_penanda(keluaran[DOCS / "alat/index.html"], "DAFTAR-ALAT", daftar_halaman_alat(alat))
    readme = AKAR / "README.md"
    keluaran[readme] = ganti_penanda(readme.read_text(encoding="utf-8"), "ALAT", tabel_readme(alat), baris_baru=True)
    semua_html = set(k for k in keluaran if k.suffix == ".html") | set(DOCS.rglob("*.html"))
    keluaran[DOCS / "sitemap.xml"] = sitemap(semua_html)
    keluaran[DOCS / "sw.js"] = service_worker()
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
