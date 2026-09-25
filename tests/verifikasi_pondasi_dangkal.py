"""Verifikasi kalkulator pondasi dangkal.

1. Faktor daya dukung dibandingkan dengan nilai tabel yang umum di buku teks
   (Das, Principles of Foundation Engineering: Nc, Nq dari Reissner/Prandtl, Nγ Vesic).
2. Seluruh hitungan ditulis ulang di Python dan dibandingkan dengan JavaScript.

Jalankan dari akar repo:  python3 tests/verifikasi_pondasi_dangkal.py
"""
import json
import math
import subprocess
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
JS = AKAR / "docs/assets/pondasi-dangkal-hitung.js"
GW = 9.81

# φ: (Nc, Nq, Nγ) — nilai tabel dua desimal
TABEL = {0: (5.14, 1.00, 0.00), 20: (14.83, 6.40, 5.39), 30: (30.14, 18.40, 22.40), 35: (46.12, 33.30, 48.03)}


def faktor(phi):
    p = math.radians(phi)
    Nq = math.tan(math.pi / 4 + p / 2) ** 2 * math.exp(math.pi * math.tan(p))
    Nc = math.pi + 2 if phi == 0 else (Nq - 1) / math.tan(p)
    return Nc, Nq, 2 * (Nq + 1) * math.tan(p)


def hitung_python(m):
    Nc, Nq, Ng = faktor(m["phi"])
    p = math.radians(m["phi"])
    BL = {"lajur": 0, "persegi-panjang": m["B"] / m["L"]}.get(m["bentuk"], 1)
    Fcs, Fqs, Fgs = 1 + BL * Nq / Nc, 1 + BL * math.tan(p), 1 - 0.4 * BL
    r = m["Df"] / m["B"]
    k = r if r <= 1 else math.atan(r)
    if m["phi"] == 0:
        Fcd, Fqd = 1 + 0.4 * k, 1.0
    else:
        Fqd = 1 + 2 * math.tan(p) * (1 - math.sin(p)) ** 2 * k
        Fcd = Fqd - (1 - Fqd) / (Nc * math.tan(p))
    g_ef = m["gammaSat"] - GW
    if not m["adaMAT"] or m["dw"] >= m["Df"] + m["B"]:
        q, g3 = m["gamma"] * m["Df"], m["gamma"]
    elif m["dw"] <= m["Df"]:
        q, g3 = m["gamma"] * m["dw"] + g_ef * (m["Df"] - m["dw"]), g_ef
    else:
        q, g3 = m["gamma"] * m["Df"], g_ef + (m["dw"] - m["Df"]) / m["B"] * (m["gamma"] - g_ef)
    qu = m["c"] * Nc * Fcs * Fcd + q * Nq * Fqs * Fqd + 0.5 * g3 * m["B"] * Ng * Fgs
    return {"qu": qu, "qall": qu / m["FS"], "quNet": qu - q}


def hitung_js(m):
    skrip = (
        "const h=require(process.argv[1]);const r=h.hitung(JSON.parse(process.argv[2]));"
        "console.log(JSON.stringify(r.galat.length?{galat:r.galat}:{qu:r.qu,qall:r.qall,quNet:r.quNet}))"
    )
    return json.loads(subprocess.check_output(["node", "-e", skrip, str(JS), json.dumps(m)], text=True))


def faktor_js(phi):
    skrip = "const h=require(process.argv[1]);console.log(JSON.stringify(h.faktorDayaDukung(+process.argv[2])))"
    return json.loads(subprocess.check_output(["node", "-e", skrip, str(JS), str(phi)], text=True))


DASAR = {"bentuk": "persegi", "B": 2, "L": 2, "Df": 1.5, "c": 10, "phi": 30, "gamma": 18,
         "gammaSat": 19.5, "adaMAT": False, "dw": 0, "FS": 3}
KASUS = {
    "contoh halaman (bujur sangkar)": DASAR,
    "lajur, lempung φ=0": dict(DASAR, bentuk="lajur", c=40, phi=0, Df=1),
    "persegi panjang, MAT kasus 1": dict(DASAR, bentuk="persegi-panjang", B=2, L=3, adaMAT=True, dw=0.8),
    "lingkaran, MAT kasus 2": dict(DASAR, bentuk="lingkaran", B=2.5, adaMAT=True, dw=2.5, phi=34, c=0),
    "Df/B > 1": dict(DASAR, B=1, Df=2, phi=25),
}


def main():
    gagal = 0
    for phi, nilai in TABEL.items():
        js = faktor_js(phi)
        for nama, acuan, hasil in zip(("Nc", "Nq", "Nγ"), nilai, (js["Nc"], js["Nq"], js["Ng"])):
            if round(hasil, 2) != acuan:
                gagal += 1
                print(f"GAGAL  tabel φ={phi}: {nama} = {hasil:.3f}, tabel {acuan}")
    print("Faktor daya dukung cocok dengan tabel untuk φ = " + ", ".join(map(str, TABEL)) if not gagal else "")

    for nama, m in KASUS.items():
        py, js = hitung_python(m), hitung_js(m)
        for kunci, nilai in py.items():
            if abs(nilai - js[kunci]) > 1e-6 * max(1, abs(nilai)):
                gagal += 1
                print(f"GAGAL  {nama}: {kunci} python={nilai:.4f} js={js[kunci]:.4f}")
        print(f"{nama:32s} qu = {py['qu']:9.2f} kPa   qall = {py['qall']:8.2f} kPa")

    if not hitung_js(dict(DASAR, bentuk="persegi-panjang", L=1)).get("galat"):
        gagal += 1
        print("GAGAL  L < B tidak ditolak")

    print("\nSemua cocok." if not gagal else f"\n{gagal} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
