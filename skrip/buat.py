"""Buat kerangka alat atau catatan baru, lalu bangun ulang situs.

Pemakaian (dari akar repo):
  python3 skrip/buat.py alat <id> --judul "Judul alat" --kategori fondasi --sumber "Penulis (tahun), judul, halaman" [--sumber ...]
  python3 skrip/buat.py catatan "Judul catatan"

Alat baru mendapat:
  docs/assets/<id>-hitung.js      rumus (pola UMD, bisa di-require di Node), masih kosong
  docs/assets/<id>-tampilan.js    formulir dan langkah hitungan, masih kosong
  docs/kalkulator/<id>.html       halaman dengan penanda menu dan footer
  tests/verifikasi_<id>.py        kerangka uji: contoh soal buku dan uji sifat (dilewati sampai diisi)
  entri di konten/alat.json       status "belum"

Rumus tidak pernah dibuat otomatis. Sumber wajib diisi (Aturan Sumber di .claude/rencana.md),
dan rumus ditulis tangan setelah halaman sumbernya ada.

Catatan baru mendapat nomor berikutnya di konten/catatan/ dengan urutan isi konsep, contoh, latihan.
"""
import argparse
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
REGISTRI = AKAR / "konten/alat.json"
BULAN = "Januari Februari Maret April Mei Juni Juli Agustus September Oktober November Desember".split()


def slug(teks):
    return re.sub(r"[^a-z0-9]+", "-", teks.lower()).strip("-")


def nama_global(id_):
    return "".join(b.capitalize() for b in id_.split("-"))


def tulis_baru(jalur, isi):
    if jalur.exists():
        sys.exit(f"Berkas sudah ada, tidak ditimpa: {jalur.relative_to(AKAR)}")
    jalur.parent.mkdir(parents=True, exist_ok=True)
    jalur.write_text(isi, encoding="utf-8")
    print("  dibuat", jalur.relative_to(AKAR))


HITUNG = """/*
 * {judul}: hitungan saja (tanpa tampilan) supaya bisa diuji terpisah.
 * Satuan internal: m, kN, kPa.
 *
 * Sumber:
{sumber}
 *
 * Rumus belum ditulis. Tulis setiap rumus beserta nomor halaman sumbernya di komentar ini
 * dan di halaman alat. Nilai yang belum bisa diverifikasi ditandai [BELUM TERVERIFIKASI].
 */
(function (root) {{
  'use strict';

  function hitung(m) {{
    return {{ galat: ['Rumus alat ini belum ditulis.'] }};
  }}

  var api = {{ hitung: hitung }};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.{global_} = api;
}})(this);
"""

TAMPILAN = """/* Tampilan {judul}: formulir dan langkah hitungan. */
(function () {{
  'use strict';
  var U = window.Umum;

  function mulai() {{
    var r = {global_}.hitung({{}});
    var el = U.$('hasil');
    el.innerHTML = '<h2>Hasil</h2>';
    (r.galat || []).forEach(function (g) {{
      var d = document.createElement('div');
      d.className = 'catatan galat';
      d.textContent = g;
      el.appendChild(d);
    }});
  }}

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
}})();
"""

HALAMAN = """<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{judul} · Defsa Yurinda</title>
  <meta name="description" content="{deskripsi}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{judul} · Defsa Yurinda">
  <meta property="og:description" content="{deskripsi}">
  <meta property="og:url" content="https://defsayurinda.github.io/kalkulator/{id}.html">
  <meta property="og:image" content="https://defsayurinda.github.io/assets/pratinjau.png">
  <meta property="og:locale" content="id_ID">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#c8421a">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <link rel="stylesheet" href="../assets/gaya.css">
  <link rel="icon" href="../assets/ikon.svg" type="image/svg+xml">
</head>
<body>
  <!-- NAV:MULAI -->
  <!-- NAV:SELESAI -->

  <main class="wadah">
    <header class="pahlawan" style="padding-bottom:16px">
      <span class="label-atas">Kalkulator · {kategori}</span>
      <h1>{judul}</h1>
      <p class="lead">{deskripsi}</p>
    </header>

    <section id="hasil" aria-live="polite"></section>

    <section>
      <h2>Sumber rumus</h2>
      <ul class="daftar-bersih">
{sumber_li}
      </ul>
      <div class="catatan"><strong>Alat bantu belajar.</strong> Hasil kalkulator ini tidak menggantikan analisis dan pemeriksaan oleh ahli geoteknik untuk keperluan desain.</div>
    </section>
  </main>

  <!-- FOOTER:MULAI -->
  <!-- FOOTER:SELESAI -->

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" defer></script>
  <script src="../assets/umum.js" defer></script>
  <script src="../assets/{id}-hitung.js" defer></script>
  <script src="../assets/{id}-tampilan.js" defer></script>
</body>
</html>
"""

UJI = '''"""Verifikasi {judul}.

Kerangka dari skrip/buat.py. Sebelum status alat di konten/alat.json dinaikkan menjadi "asli":
1. Contoh soal buku: salin data dan jawaban satu contoh soal utuh, tulis judul buku, edisi, dan
   halaman di komentar, lalu bandingkan dengan hasil hitung(). Beri penanda CONTOH-BUKU di baris
   komentarnya (dibaca tests/verifikasi_registri.py).
2. Uji sifat: misalnya hasil naik bila beban naik, atau hasil tidak berubah bila lapisan dipecah.

Jalankan dari akar repo:  python3 tests/verifikasi_{id_py}.py
"""
import json
import subprocess
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
JS = AKAR / "docs/assets/{id}-hitung.js"


def hitung_js(m):
    skrip = "const t=require(process.argv[1]);console.log(JSON.stringify(t.hitung(JSON.parse(process.argv[2]))))"
    return json.loads(subprocess.check_output(["node", "-e", skrip, str(JS), json.dumps(m)], text=True))


def main():
    gagal = 0
    if not isinstance(hitung_js({{}}), dict):
        print("GAGAL  hitung() tidak mengembalikan objek")
        gagal += 1
    print("DILEWATI  contoh soal buku: belum ada halaman sumber.")
    print("DILEWATI  uji sifat: rumus belum ditulis.")
    print("\\nSemua cocok." if not gagal else f"\\n{{gagal}} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
'''

CATATAN = """# {nomor} — {judul}

Ditulis {bulan}.

<!-- Isi bagian ini dengan urutan: konsep, contoh dari pengalaman sendiri, latihan. Hapus komentar ini. -->

## Konsep

## Contoh

## Latihan
"""


def buat_alat(a):
    id_ = a.id
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", id_):
        sys.exit("id hanya boleh huruf kecil, angka, dan tanda hubung, misalnya efisiensi-kelompok")
    reg = json.loads(REGISTRI.read_text(encoding="utf-8"))
    if any(x["id"] == id_ for x in reg["alat"]):
        sys.exit(f"Alat {id_} sudah ada di konten/alat.json")
    kategori = {k["id"]: k["judul"] for k in reg["kategori"]}
    if a.kategori not in kategori:
        sys.exit("kategori harus salah satu dari: " + ", ".join(kategori))
    if not a.sumber:
        sys.exit("Isi minimal satu --sumber. Rumus tanpa sumber tidak boleh ditulis (Aturan Sumber).")
    deskripsi = a.deskripsi or f"{a.judul}, lengkap dengan langkah hitungan."
    global_ = nama_global(id_)
    esc = lambda t: t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    tulis_baru(AKAR / f"docs/assets/{id_}-hitung.js",
               HITUNG.format(judul=a.judul, global_=global_, sumber="\n".join(f" *   - {s}" for s in a.sumber)))
    tulis_baru(AKAR / f"docs/assets/{id_}-tampilan.js", TAMPILAN.format(judul=a.judul, global_=global_))
    tulis_baru(AKAR / f"docs/kalkulator/{id_}.html",
               HALAMAN.format(id=id_, judul=esc(a.judul), deskripsi=esc(deskripsi), kategori=esc(kategori[a.kategori]),
                              sumber_li="\n".join(f"        <li>{esc(s)}</li>" for s in a.sumber)))
    tulis_baru(AKAR / f"tests/verifikasi_{id_.replace('-', '_')}.py",
               UJI.format(judul=a.judul, id=id_, id_py=id_.replace("-", "_")))
    reg["alat"].append({
        "id": id_, "judul": a.judul, "judul_pendek": a.judul, "deskripsi": deskripsi,
        "kategori": a.kategori, "lencana": kategori[a.kategori], "halaman": f"kalkulator/{id_}.html",
        "ringkas": esc(deskripsi),
        "rincian": [["Metode", "Belum ditulis"], ["Masukan", "Belum ditulis"], ["Keluaran", "Belum ditulis"]],
        "skrip": [f"docs/assets/{id_}-hitung.js", f"docs/assets/{id_}-tampilan.js"],
        "sumber": a.sumber, "status": "belum", "tanggal_cek": date.today().isoformat(),
        "uji": [f"tests/verifikasi_{id_.replace('-', '_')}.py"],
    })
    REGISTRI.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("  entri ditambahkan ke konten/alat.json (status: belum)")


def buat_catatan(a):
    folder = AKAR / "konten/catatan"
    nomor = max([int(f.name[:2]) for f in folder.glob("[0-9][0-9]-*.md")] + [0]) + 1
    hari = date.today()
    tulis_baru(folder / f"{nomor:02d}-{slug(a.judul)}.md",
               CATATAN.format(nomor=f"{nomor:02d}", judul=a.judul, bulan=f"{BULAN[hari.month - 1]} {hari.year}"))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="jenis", required=True)
    pa = sub.add_parser("alat")
    pa.add_argument("id")
    pa.add_argument("--judul", required=True)
    pa.add_argument("--kategori", required=True)
    pa.add_argument("--sumber", action="append", default=[])
    pa.add_argument("--deskripsi")
    pc = sub.add_parser("catatan")
    pc.add_argument("judul")
    a = p.parse_args()
    (buat_alat if a.jenis == "alat" else buat_catatan)(a)
    subprocess.run([sys.executable, str(AKAR / "skrip/bangun_situs.py")], check=True)


if __name__ == "__main__":
    main()
