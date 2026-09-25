"""Verifikasi kalkulator konsolidasi.

1. Hubungan U–Tv dibandingkan dengan nilai yang umum di buku teks
   (U = 50% → Tv = 0,197; U = 60% → 0,286; U = 90% → 0,848) dan dengan rumus pendekatan
   Tv = (π/4)U² untuk U < 60%.
2. Besar penurunan dan waktu ditulis ulang di Python lalu dibandingkan dengan JavaScript.

Jalankan dari akar repo:  python3 tests/verifikasi_konsolidasi.py
"""
import json
import math
import subprocess
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
JS = AKAR / "docs/assets/konsolidasi-hitung.js"


def u_dari_tv(tv):
    return 1 - sum(2 / M**2 * math.exp(-M**2 * tv) for M in ((2 * m + 1) * math.pi / 2 for m in range(200)))


def tv_dari_u(u):
    a, b = 0.0, 10.0
    for _ in range(200):
        c = (a + b) / 2
        a, b = (c, b) if u_dari_tv(c) < u else (a, c)
    return (a + b) / 2


def hitung_python(m):
    if m["modeDelta"] == "manual":
        d = m["delta"]
    elif m["bentuk2"] == "lajur":
        d = m["q"] * m["B2"] / (m["B2"] + m["z"])
    else:
        d = m["q"] * m["B2"] * m["L2"] / ((m["B2"] + m["z"]) * (m["L2"] + m["z"]))
    s0, sc, s1 = m["s0"], m["sc"], m["s0"] + d
    a = m["H"] / (1 + m["e0"])
    if sc == s0:
        Sc = m["Cc"] * a * math.log10(s1 / s0)
    elif s1 <= sc:
        Sc = m["Cs"] * a * math.log10(s1 / s0)
    else:
        Sc = m["Cs"] * a * math.log10(sc / s0) + m["Cc"] * a * math.log10(s1 / sc)
    Hdr = m["H"] / 2 if m["drainase"] == "dua" else m["H"]
    hasil = {"Sc": Sc, "t50": tv_dari_u(0.5) * Hdr**2 / m["cv"], "t90": tv_dari_u(0.9) * Hdr**2 / m["cv"]}
    if m["t"] > 0:
        hasil["St"] = u_dari_tv(m["cv"] * m["t"] / Hdr**2) * Sc
    return hasil


def jalankan_js(ekspresi, *arg):
    skrip = f"const h=require(process.argv[1]);const a=process.argv.slice(2);console.log(JSON.stringify({ekspresi}))"
    return json.loads(subprocess.check_output(["node", "-e", skrip, str(JS), *map(str, arg)], text=True))


def hitung_js(m):
    return jalankan_js(
        "(r=>r.galat.length?{galat:r.galat}:Object.assign({Sc:r.Sc,t50:r.t50,t90:r.t90},r.hasilT?{St:r.hasilT.St}:{}))"
        "(h.hitung(JSON.parse(a[0])))", json.dumps(m))


DASAR = {"H": 4, "e0": 1.1, "Cc": 0.36, "Cs": 0.06, "s0": 60, "sc": 60, "modeDelta": "2:1", "delta": 50,
         "q": 150, "bentuk2": "persegi", "B2": 3, "L2": 3, "z": 4, "cv": 1.5, "drainase": "dua", "t": 1}
KASUS = {
    "contoh halaman (NC, 2:1)": DASAR,
    "OC, tetap di bawah σ'c": dict(DASAR, sc=150),
    "OC, melewati σ'c": dict(DASAR, sc=80),
    "Δσ manual, satu arah": dict(DASAR, modeDelta="manual", delta=40, drainase="satu", t=3),
    "pondasi lajur": dict(DASAR, bentuk2="lajur", B2=2, t=0),
}


def main():
    gagal = 0
    for u, acuan in ((0.5, 0.197), (0.6, 0.286), (0.9, 0.848)):
        tv = jalankan_js("h.faktorWaktu(+a[0])", u)
        if abs(tv - acuan) > 0.001:
            gagal += 1
            print(f"GAGAL  Tv(U={u:.0%}) = {tv:.4f}, acuan {acuan}")
        else:
            print(f"Tv(U={u:.0%}) = {tv:.4f}  (acuan buku teks {acuan})")
    for u in (0.2, 0.4, 0.55):
        tv = jalankan_js("h.faktorWaktu(+a[0])", u)
        # Pendekatan (π/4)U² makin menyimpang mendekati U = 60%; selisih < 1% masih wajar.
        if abs(tv - math.pi / 4 * u**2) / tv > 0.01:
            gagal += 1
            print(f"GAGAL  Tv(U={u}) tidak cocok dengan (π/4)U²")

    for nama, m in KASUS.items():
        py, js = hitung_python(m), hitung_js(m)
        for kunci, nilai in py.items():
            if abs(nilai - js[kunci]) > 1e-6 * max(1, abs(nilai)):
                gagal += 1
                print(f"GAGAL  {nama}: {kunci} python={nilai:.5f} js={js[kunci]:.5f}")
        print(f"{nama:28s} Sc = {py['Sc'] * 1000:7.1f} mm   t90 = {py['t90']:6.2f} tahun")

    if not hitung_js(dict(DASAR, sc=40)).get("galat"):
        gagal += 1
        print("GAGAL  σ'c < σ'0 tidak ditolak")

    # Kerangka B5: contoh soal buku utuh (judul, edisi, halaman) ditambahkan setelah Defsa mengirim halamannya.

    print("DILEWATI  contoh soal buku: belum ada halaman sumber dari Defsa (temuan B5).")

    print("\nSemua cocok." if not gagal else f"\n{gagal} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
