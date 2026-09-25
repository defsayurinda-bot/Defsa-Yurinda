"""Verifikasi bank soal latihan.

Untuk setiap templat dibangkitkan 300 soal dengan kode (seed) berbeda, lalu diperiksa:
1. Kunci jawaban berupa angka positif yang wajar (tidak NaN, tidak galat).
2. Kunci jawaban dihitung ulang di Python dari data soal secara terpisah.
3. Kode soal yang sama selalu menghasilkan soal yang sama.
4. Aturan toleransi 2% bekerja.

Jalankan dari akar repo:  python3 tests/verifikasi_latihan.py
"""
import json
import math
import subprocess
import sys
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
JS = AKAR / "docs/assets/latihan-soal.js"
T = 9.80665
JUMLAH = 300

SKRIP = r"""
const L = require(process.argv[1]);
const F = { f: (x, d) => x.toFixed(d), t: (x, d) => x.toFixed(d) };
const n = +process.argv[2];
const hasil = {};
for (const tp of L.TEMPLAT) {
  hasil[tp.id] = [];
  for (let s = 1; s <= n; s++) {
    const a = L.buatSoal(tp.id, s * 7919, F), b = L.buatSoal(tp.id, s * 7919, F);
    const langkah = a.langkah(F);
    hasil[tp.id].push({ jawaban: a.jawaban, data: a.data, sama: a.teks === b.teks && a.jawaban === b.jawaban,
                        adaLangkah: Array.isArray(langkah) && langkah.length > 0 });
  }
}
hasil._toleransi = [L.periksaJawaban(101.9, 100), L.periksaJawaban(102.1, 100), L.periksaJawaban(NaN, 100)];
console.log(JSON.stringify(hasil));
"""


def faktor(phi):
    p = math.radians(phi)
    Nq = math.tan(math.pi / 4 + p / 2) ** 2 * math.exp(math.pi * math.tan(p))
    return {"Nq": Nq, "Nc": (Nq - 1) / math.tan(p), "Ng": 2 * (Nq + 1) * math.tan(p)}


def u_dari_tv(tv):
    return 1 - sum(2 / M**2 * math.exp(-M**2 * tv) for M in ((2 * m + 1) * math.pi / 2 for m in range(200)))


def tv_90():
    a, b = 0.0, 5.0
    for _ in range(100):
        c = (a + b) / 2
        a, b = (c, b) if u_dari_tv(c) < 0.9 else (a, c)
    return (a + b) / 2


TV90 = tv_90()


def kunci_python(tid, d):
    if tid == "faktor-daya-dukung":
        return faktor(d["phi"])[d["jenis"]]
    if tid == "lajur-lempung":
        return d["c"] * (math.pi + 2) * (1 + 0.4 * d["Df"] / d["B"]) + d["gamma"] * d["Df"]
    if tid == "bujur-sangkar-pasir":
        N, p = faktor(d["phi"]), math.radians(d["phi"])
        Fqd = 1 + 2 * math.tan(p) * (1 - math.sin(p)) ** 2 * d["Df"] / d["B"]
        return d["gamma"] * d["Df"] * N["Nq"] * (1 + math.tan(p)) * Fqd + 0.5 * d["gamma"] * d["B"] * N["Ng"] * 0.6
    if tid == "tekanan-mat":
        return d["gamma"] * d["dw"] + (d["gammaSat"] - 9.81) * (d["Df"] - d["dw"])
    if tid == "penurunan-nc":
        return 1000 * d["Cc"] * d["H"] / (1 + d["e0"]) * math.log10((d["s0"] + d["delta"]) / d["s0"])
    if tid == "penurunan-oc":
        a = d["H"] / (1 + d["e0"])
        return 1000 * (d["Cs"] * a * math.log10(d["sc"] / d["s0"]) + d["Cc"] * a * math.log10((d["s0"] + d["delta"]) / d["sc"]))
    if tid == "waktu-t90":
        Hdr = d["H"] / 2 if d["drainase"] == "dua" else d["H"]
        return TV90 * Hdr**2 / d["cv"]
    if tid == "tegangan-21":
        return d["q"] * d["B2"] * d["L2"] / ((d["B2"] + d["z"]) * (d["L2"] + d["z"]))
    if tid == "rw-ujung":
        N = d["lapisan"][0]["N"]
        # Lastiasih dkk. (2013), Media Komunikasi Teknik Sipil 19(2), hlm. 136, pers. (2)-(3)
        qp = 40 / 0.3048**2 if N > 60 else 2 / 3 * N / 0.3048**2
        return qp * T * math.pi * d["d"] ** 2 / 4
    if tid == "meyerhof-selimut":
        N = d["lapisan"][0]["N"]
        return 100 * N / (100 if d["perpindahan"] == "kecil" else 50) * math.pi * d["d"] * d["L"]
    raise KeyError(tid)


def main():
    hasil = json.loads(subprocess.check_output(["node", "-e", SKRIP, str(JS), str(JUMLAH)], text=True))
    gagal = 0
    toleransi = hasil.pop("_toleransi")
    if toleransi != [True, False, False]:
        gagal += 1
        print(f"GAGAL  aturan toleransi: {toleransi}")
    for tid, daftar in hasil.items():
        g = 0
        for i, s in enumerate(daftar):
            j = s["jawaban"]
            if not (isinstance(j, (int, float)) and math.isfinite(j) and j > 0):
                g += 1
                print(f"GAGAL  {tid} #{i}: kunci tidak valid ({j})")
                continue
            k = kunci_python(tid, s["data"])
            if abs(k - j) > 1e-6 * max(1, abs(k)):
                g += 1
                print(f"GAGAL  {tid} #{i}: js={j:.4f} python={k:.4f}")
            if not s["sama"] or not s["adaLangkah"]:
                g += 1
                print(f"GAGAL  {tid} #{i}: soal tidak deterministik atau pembahasan kosong")
        rentang = [s["jawaban"] for s in daftar]
        print(f"{tid:22s} {len(daftar)} soal, kunci {min(rentang):9.2f} – {max(rentang):9.2f}" + ("" if not g else f"  ({g} gagal)"))
        gagal += g
    print("\nSemua cocok." if not gagal else f"\n{gagal} pemeriksaan gagal.")
    sys.exit(1 if gagal else 0)


if __name__ == "__main__":
    main()
