"""Verifikasi keamanan teks dari tautan berbagi (temuan B6).

1. Fungsi esc() dan tanpaHTML() di docs/assets/umum.js diuji langsung di Node.
2. Setiap kalkulator yang membaca tautan berbagi (bacaHash) wajib menolak isi berisi
   karakter HTML lewat tanpaHTML().
3. Kerangka praktikum wajib meng-escape nama kolom dan isian teks di masukan(), dan
   definisi alat tidak boleh meng-escape ulang (supaya "&" tidak tampil sebagai "&amp;").

Uji tampilan di browser (nama <img src=x onerror=alert(1)> tampil sebagai teks) dijalankan
manual dengan Playwright di sesi kerja; hasilnya dicatat di laporan tahap.

Jalankan dari akar repo:  python3 tests/verifikasi_keamanan.py
"""
import json
import re
import subprocess
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
ASET = AKAR / "docs/assets"
SERANGAN = '<img src=x onerror=alert(1)>'


def node(skrip):
    return json.loads(subprocess.check_output(["node", "-e", skrip], text=True))


def main():
    gagal = []

    hasil = node(
        "global.window={};require(%s);const U=window.Umum;"
        "console.log(JSON.stringify({esc:U.esc(%s),amp:U.esc('a & b'),"
        "aman:U.tanpaHTML({lapisan:[{jenis:'pasir',N:20}],bentuk:'bujur-sangkar'}),"
        "tolak:U.tanpaHTML({lapisan:[{jenis:%s,N:20}]}),"
        "tolakKunci:U.tanpaHTML({'<b>':1})}))"
        % (json.dumps(str(ASET / "umum.js")), json.dumps(SERANGAN), json.dumps(SERANGAN))
    )
    if hasil["esc"] != "&lt;img src=x onerror=alert(1)&gt;":
        gagal.append(f"esc() tidak meng-escape: {hasil['esc']}")
    if hasil["amp"] != "a &amp; b":
        gagal.append(f"esc() salah untuk &: {hasil['amp']}")
    if not hasil["aman"]:
        gagal.append("tanpaHTML() menolak data biasa")
    if hasil["tolak"] or hasil["tolakKunci"]:
        gagal.append("tanpaHTML() menerima teks berisi HTML")

    for berkas in sorted(ASET.glob("*-tampilan.js")):
        teks = berkas.read_text(encoding="utf-8")
        for m in re.finditer(r"bacaHash\((.*?)\)\s*(?:\|\||;)", teks):
            if "tanpaHTML" not in m.group(1):
                gagal.append(f"{berkas.name}: bacaHash tanpa tanpaHTML")

    kerangka = (ASET / "praktikum/kerangka.js").read_text(encoding="utf-8")
    for pola in ("nama: esc(k.nama", "o[k.id] = esc(", "pilihanSah(p.pilihan", "pilihanSah(k.pilihan",
                 "tb.pilihanBaris.indexOf(b.nama)", "label(esc(s.nama"):
        if pola not in kerangka:
            gagal.append(f"kerangka.js: tidak ditemukan '{pola}'")
    for berkas in sorted((ASET / "praktikum").glob("alat-*.js")):
        if "U.esc(" in berkas.read_text(encoding="utf-8"):
            gagal.append(f"{berkas.name}: U.esc() membuat escape ganda; nilai sudah di-escape di kerangka")

    for g in gagal:
        print("GAGAL ", g)
    print("\nSemua cocok." if not gagal else f"\n{len(gagal)} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
