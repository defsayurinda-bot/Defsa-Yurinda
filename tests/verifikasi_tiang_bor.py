"""Verifikasi kalkulator tiang bor.

Hitungan ditulis ulang di Python secara terpisah dari kode JavaScript,
lalu hasil keduanya dibandingkan untuk beberapa kasus.

Jalankan dari akar repo:  python3 tests/verifikasi_tiang_bor.py
"""
import json
import math
import subprocess
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
T = 9.80665  # kPa per t/m²


def rata_n(lapisan, z1, z2):
    jumlah = tebal = 0.0
    for ly in lapisan:
        a, b = max(ly["atas"], z1), min(ly["bawah"], z2)
        if b > a:
            jumlah += ly["N"] * (b - a)
            tebal += b - a
    return jumlah / tebal


def lapisan_ujung(lapisan, L):
    return next(ly for ly in lapisan if ly["atas"] <= L < ly["bawah"])


def hitung_python(m):
    d, L = m["d"], m["L"]
    Ap, p = math.pi * d**2 / 4, math.pi * d
    W = m["gammaBeton"] * Ap * L if m["pakaiBerat"] else 0.0

    # Reese & Wright (1977)
    Qs_rw = 0.0
    for ly in m["lapisan"]:
        h = min(ly["bawah"], L) - ly["atas"]
        if h <= 0:
            continue
        if ly["jenis"] == "lempung":
            fs = 0.55 * ly["cu"]
        else:
            fs = 0.32 * min(ly["N"], 53) * T
        Qs_rw += fs * p * h
    u = lapisan_ujung(m["lapisan"], L)
    qp_rw = 9 * u["cu"] if u["jenis"] == "lempung" else min(7 * u["N"], 400) * T
    Qu_rw = qp_rw * Ap + Qs_rw - W

    # Meyerhof (1976)
    pembagi = 50 if m["perpindahan"] == "besar" else 100
    Qs_m = sum(100 * ly["N"] / pembagi * p * (min(ly["bawah"], L) - ly["atas"])
               for ly in m["lapisan"] if min(ly["bawah"], L) > ly["atas"])
    N_rata = rata_n(m["lapisan"], max(0, L - 8 * d), L + 4 * d)
    Lb = L - u["atas"]
    qp_m = min(38 * N_rata * Lb / d, 380 * N_rata)
    Qu_m = qp_m * Ap + Qs_m - W

    return {
        "rw": {"Qp": qp_rw * Ap, "Qs": Qs_rw, "Qu": Qu_rw, "Qa": Qu_rw / m["SF"]},
        "my": {"Qp": qp_m * Ap, "Qs": Qs_m, "Qu": Qu_m, "Qa": Qu_m / m["SF"], "Nrata": N_rata},
    }


def hitung_js(m):
    skrip = (
        "const t=require(process.argv[1]);"
        "const r=t.hitung(JSON.parse(process.argv[2]));"
        "if(r.galat.length){console.log(JSON.stringify({galat:r.galat}));process.exit(0)}"
        "const k=x=>({Qp:x.Qp,Qs:x.Qs,Qu:x.Qu,Qa:x.Qa,Nrata:x.Nrata});"
        "console.log(JSON.stringify({rw:k(r.reeseWright),my:k(r.meyerhof)}));"
    )
    keluaran = subprocess.check_output(
        ["node", "-e", skrip, str(AKAR / "docs/assets/tiang-bor-hitung.js"), json.dumps(m)], text=True
    )
    return json.loads(keluaran)


def ly(atas, bawah, jenis, N, cu=None):
    return {"atas": atas, "bawah": bawah, "jenis": jenis, "N": N, "cu": cu}


CONTOH = {  # data contoh di halaman kalkulator (fiktif)
    "d": 0.6, "L": 12, "SF": 2.5, "gammaBeton": 24, "pakaiBerat": True, "perpindahan": "kecil",
    "lapisan": [ly(0, 3, "lempung", 4, 25), ly(3, 7, "lempung", 8, 50), ly(7, 11, "pasir", 20),
                ly(11, 16, "pasir", 40), ly(16, 20, "pasir", 55)],
}

KASUS = {
    "contoh halaman": CONTOH,
    "pasir seragam, pancang": {
        "d": 0.8, "L": 18, "SF": 2.5, "gammaBeton": 24, "pakaiBerat": False, "perpindahan": "besar",
        "lapisan": [ly(0, 25, "pasir", 30)],
    },
    "N tinggi (batas aktif)": {
        "d": 0.5, "L": 10, "SF": 3, "gammaBeton": 24, "pakaiBerat": True, "perpindahan": "kecil",
        "lapisan": [ly(0, 9, "pasir", 60), ly(9, 15, "pasir", 70)],
    },
    "ujung di lempung": {
        "d": 1.0, "L": 15, "SF": 2.5, "gammaBeton": 24, "pakaiBerat": True, "perpindahan": "kecil",
        "lapisan": [ly(0, 5, "pasir", 12), ly(5, 22, "lempung", 15, 90)],
    },
}


def main():
    gagal = 0
    for nama, m in KASUS.items():
        py, js = hitung_python(m), hitung_js(m)
        for metode in ("rw", "my"):
            for kunci, nilai in py[metode].items():
                selisih = abs(nilai - js[metode][kunci])
                ok = selisih <= 1e-6 * max(1.0, abs(nilai))
                gagal += not ok
                if not ok:
                    print(f"GAGAL  {nama:24s} {metode}.{kunci}: python={nilai:.4f} js={js[metode][kunci]:.4f}")
        print(f"{nama:24s}  RW Qu={py['rw']['Qu']:9.2f} kN   Meyerhof Qu={py['my']['Qu']:9.2f} kN")

    # Kasus salah harus ditolak
    salah = dict(CONTOH, L=18)  # data tanah tidak sampai 4d di bawah ujung
    if not hitung_js(salah).get("galat"):
        print("GAGAL  masukan salah tidak ditolak")
        gagal += 1

    print("\nSemua cocok." if not gagal else f"\n{gagal} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
