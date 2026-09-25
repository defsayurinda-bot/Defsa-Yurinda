"""Verifikasi alat praktikum Mekanika Tanah.

Setiap hitungan ditulis ulang di Python (tanpa pustaka tambahan) lalu dibandingkan
dengan modul JavaScript di docs/assets/praktikum/. Ditambah nilai acuan yang diketahui:
- massa jenis air Tanaka dkk. (2001): 20 °C = 0,9982067 g/cm³; 25 °C = 0,9970470 g/cm³
- faktor satu titik batas cair: N = 25 tidak mengubah kadar air
- klasifikasi bagan plastisitas pada titik-titik uji yang jelas
- USCS dari bagan alir ASTM D2487, AASHTO dan indeks kelompok (contoh Das)
- hidrometer: viskositas air terhadap IAPWS, faktor a terhadap tabel ASTM D422

Jalankan dari akar repo:  python3 tests/verifikasi_praktikum.py
"""
import json
import math
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
P = AKAR / "docs/assets/praktikum"
gagal = 0


def js(modul, fungsi, data):
    skrip = ("const m=require(process.argv[1]);const r=m[process.argv[2]](JSON.parse(process.argv[3]));"
             "console.log(JSON.stringify(r,(k,v)=>typeof v==='function'?undefined:v))")
    return json.loads(subprocess.check_output(["node", "-e", skrip, str(P / modul), fungsi, json.dumps(data)], text=True))


def cocok(nama, py, nilai_js, tol=1e-9):
    global gagal
    if nilai_js is None or abs(py - nilai_js) > tol * max(1.0, abs(py)):
        gagal += 1
        print(f"GAGAL  {nama}: python={py!r} js={nilai_js!r}")


def benar(nama, kondisi):
    global gagal
    if not kondisi:
        gagal += 1
        print(f"GAGAL  {nama}")


def rho(T):
    a1, a2, a3, a4, a5 = -3.983035, 301.797, 522528.9, 69.34881, 999.974950
    return a5 * (1 - (T + a1) ** 2 * (T + a2) / (a3 * (T + a4))) / 1000


# ---------------------------------------------------------------- sifat fisik
for T, acuan in ((20, 0.9982067), (25, 0.9970470)):
    cocok(f"ρw({T} °C) acuan Tanaka", acuan, js("hitung-sifat-fisik.js", "massaJenisAir", T), tol=2e-7)

cawan = [{"nama": "1", "W1": 45.31, "W2": 38.62, "W3": 12.10}, {"nama": "2", "W1": 47.85, "W2": 40.71, "W3": 13.42},
         {"nama": "3", "W1": 44.02, "W2": 37.60, "W3": 11.95}]
r = js("hitung-sifat-fisik.js", "kadarAir", {"cawan": cawan})
ws = [(c["W1"] - c["W2"]) / (c["W2"] - c["W3"]) * 100 for c in cawan]
cocok("kadar air rata-rata", sum(ws) / 3, r["w"])
benar("kadar air: W2 < W3 ditolak", js("hitung-sifat-fisik.js", "kadarAir", {"cawan": [{"nama": "1", "W1": 5, "W2": 4, "W3": 6}]})["galat"])

uji = [{"nama": "1", "W1": 34.215, "W2": 59.215, "W3": 149.812, "W4": 134.180, "T": 27.5, "rhoT": None},
       {"nama": "2", "W1": 35.102, "W2": 60.102, "W3": 150.540, "W4": 134.955, "T": 28.0, "rhoT": 0.99624}]
for Tref in (27.5, 20):
    r = js("hitung-sifat-fisik.js", "beratSpesifik", {"uji": uji, "Tacuan": Tref})
    G = []
    for u in uji:
        GT = (u["W2"] - u["W1"]) / ((u["W4"] - u["W1"]) - (u["W3"] - u["W2"]))
        G.append(GT * (u["rhoT"] or rho(u["T"])) / rho(Tref))
    cocok(f"Gs rata-rata (acuan {Tref} °C)", sum(G) / 2, r["G"])

# ---------------------------------------------------------------- Atterberg
ll = [{"nama": "1", "N": 38, "W1": 30.12, "W2": 25.60, "W3": 12.05}, {"nama": "2", "N": 29, "W1": 31.40, "W2": 26.35, "W3": 12.20},
      {"nama": "3", "N": 21, "W1": 32.05, "W2": 26.52, "W3": 12.31}, {"nama": "4", "N": 15, "W1": 33.10, "W2": 27.01, "W3": 12.40}]
pl = [{"nama": "1", "W1": 20.45, "W2": 18.92, "W3": 11.80}, {"nama": "2", "W1": 21.02, "W2": 19.38, "W3": 12.01}]
w_ll = [(t["W1"] - t["W2"]) / (t["W2"] - t["W3"]) * 100 for t in ll]
x = [math.log10(t["N"]) for t in ll]
mx, my = sum(x) / 4, sum(w_ll) / 4
b = sum((xi - mx) * (yi - my) for xi, yi in zip(x, w_ll)) / sum((xi - mx) ** 2 for xi in x)
LL = my - b * mx + b * math.log10(25)
PL = sum((t["W1"] - t["W2"]) / (t["W2"] - t["W3"]) * 100 for t in pl) / 2
r = js("hitung-atterberg.js", "hitung", {"ll": ll, "pl": pl, "metodeLL": "banyak", "eksponen": 0.121, "wn": 30})
cocok("LL banyak titik", LL, r["LL"])
cocok("PL", PL, r["PL"])
cocok("IP", LL - PL, r["IP"])
cocok("LI", (30 - PL) / (LL - PL), r["LI"])
r1 = js("hitung-atterberg.js", "hitung", {"ll": ll[1:3], "pl": pl, "metodeLL": "satu", "eksponen": 0.121, "wn": 0})
cocok("LL satu titik", sum(w * (t["N"] / 25) ** 0.121 for w, t in zip(w_ll[1:3], ll[1:3])) / 2, r1["LL"])
r25 = js("hitung-atterberg.js", "hitung", {"ll": [dict(ll[1], N=25)], "pl": pl, "metodeLL": "satu", "eksponen": 0.121, "wn": 0})
cocok("satu titik pada N = 25 sama dengan w", w_ll[1], r25["LL"])
for (LLx, IPx), simbol in {(35, 15): "CL", (25, 5): "CL-ML", (30, 5): "ML", (40, 3): "ML", (60, 35): "CH", (60, 20): "MH"}.items():
    s = json.loads(subprocess.check_output(["node", "-e", "const m=require(process.argv[1]);console.log(JSON.stringify(m.simbolHalus(+process.argv[2],+process.argv[3])))",
                                            str(P / "hitung-atterberg.js"), str(LLx), str(IPx)], text=True))
    benar(f"bagan plastisitas LL={LLx}, IP={IPx} → {simbol} (dapat {s['simbol']})", s["simbol"] == simbol)
benar("NP bila PL ≥ LL", js("hitung-atterberg.js", "hitung", {"ll": ll, "pl": [{"nama": "1", "W1": 20, "W2": 15, "W3": 10}], "metodeLL": "banyak", "eksponen": 0.121, "wn": 0})["NP"])

# ---------------------------------------------------------------- saringan
ukuran = {"No. 4": 4.75, "No. 10": 2.0, "No. 20": 0.85, "No. 40": 0.425, "No. 60": 0.25, "No. 100": 0.15, "No. 200": 0.075}
data = [("No. 4", 12.5), ("No. 10", 48.3), ("No. 20", 92.1), ("No. 40", 110.4), ("No. 60", 85.2), ("No. 100", 61.7), ("No. 200", 45.8)]
total, pan = 500.0, 42.6
r = js("hitung-saringan.js", "hitung", {"beratTotal": total, "pan": pan, "ayakan": [{"nama": n, "tertahan": t} for n, t in data]})
kum, titik = 0, [(9.5, 100.0)]
for n, t in data:
    kum += t
    titik.append((ukuran[n], 100 - kum / total * 100))


def diam(p):
    for (d1, p1), (d2, p2) in zip(titik, titik[1:]):
        if p1 >= p >= p2 and p1 != p2:
            return 10 ** (math.log10(d2) + (p - p2) * (math.log10(d1) - math.log10(d2)) / (p1 - p2))
    return None


for kunci, p in (("D10", 10), ("D30", 30), ("D60", 60)):
    cocok(kunci, diam(p), r[kunci])
cocok("Cu", diam(60) / diam(10), r["Cu"])
cocok("Cc", diam(30) ** 2 / (diam(10) * diam(60)), r["Cc"])
cocok("fraksi halus", titik[-1][1], r["fraksi"]["halus"])
cocok("fraksi kerikil", 100 - titik[1][1], r["fraksi"]["kerikil"])
cocok("selisih berat", (total - kum - pan) / total * 100, r["hilang"])

# ---------------------------------------------------------------- pemadatan
Gs, V, Mc = 2.65, 943.3, 4185.0
tp = [{"nama": str(i + 1), "Mtotal": m, "W1": a, "W2": b_, "W3": c}
      for i, (m, a, b_, c) in enumerate([(5901.0, 60.2, 55.9, 12.1), (6012.5, 61.3, 56.0, 12.3), (6078.0, 62.0, 55.8, 12.0),
                                         (6071.2, 63.1, 56.0, 12.2), (6025.0, 64.0, 56.1, 12.4)])]
pts = []
for t in tp:
    w = (t["W1"] - t["W2"]) / (t["W2"] - t["W3"]) * 100
    pts.append((w, (t["Mtotal"] - Mc) / V / (1 + w / 100)))
pts.sort()


def polinomial(orde):
    X = [Fraction(p[0]) for p in pts]
    Y = [Fraction(p[1]) for p in pts]
    A = [[sum(x ** (i + j) for x in X) for j in range(orde + 1)] for i in range(orde + 1)]
    v = [sum(y * x ** i for x, y in zip(X, Y)) for i in range(orde + 1)]
    n = orde + 1
    for k in range(n):
        for i in range(k + 1, n):
            f = A[i][k] / A[k][k]
            A[i] = [a - f * b for a, b in zip(A[i], A[k])]
            v[i] -= f * v[k]
    c = [Fraction(0)] * n
    for i in reversed(range(n)):
        c[i] = (v[i] - sum(A[i][j] * c[j] for j in range(i + 1, n))) / A[i][i]
    return [float(ci) for ci in c]


for orde in (2, 3):
    r = js("hitung-kepadatan.js", "pemadatan", {"Gs": Gs, "V": V, "Mcetakan": Mc, "gammaW": 1, "orde": orde, "titik": tp})
    c = polinomial(orde)
    f = lambda w: sum(ci * w ** i for i, ci in enumerate(c))
    lo, hi = pts[0][0], pts[-1][0]
    for _ in range(200):  # pencarian emas pada kurva unimodal di rentang data
        a_, b2 = hi - 0.618034 * (hi - lo), lo + 0.618034 * (hi - lo)
        lo, hi = (lo, b2) if f(a_) > f(b2) else (a_, hi)
    cocok(f"w_opt orde {orde}", (lo + hi) / 2, r["wopt"], tol=1e-5)
    cocok(f"γd maks orde {orde}", f((lo + hi) / 2), r["gdmaks"], tol=1e-9)
    cocok(f"ZAV titik 1 orde {orde}", Gs / (1 + pts[0][0] / 100 * Gs), r["titik"][0]["zav"])

# ---------------------------------------------------------------- sand cone
kal = {"W1": 1240.0, "W2": 4012.0, "W3": 3222.0}
tt = [{"nama": "1", "W6": 6000.0, "W7": 4380.0, "W8": 6000.0, "W9": 2310.0, "W10": 350.0, "W11": 3210.0,
       "W12": 15.0, "W13": 115.0, "W14": 100.2}]
r = js("hitung-kepadatan.js", "sandCone", {"kalibrasi": kal, "titik": tt, "gammaLab": 1.62, "syarat": 95})
gp = (kal["W2"] - kal["W1"]) / (kal["W3"] - kal["W1"])
t = tt[0]
Vl = ((t["W8"] - t["W9"]) - (t["W6"] - t["W7"])) / gp
w = (t["W13"] - t["W14"]) / (t["W14"] - t["W12"])
gd = (t["W11"] - t["W10"]) / (1 + w) / Vl
cocok("γ pasir", gp, r["gammaPasir"])
cocok("γd lapangan", gd, r["gammaD"])
cocok("derajat kepadatan", gd / 1.62 * 100, r["D"])

# ---------------------------------------------------------------- klasifikasi USCS (ASTM D2487 / SNI 6371:2015)
def uscs(d):
    return js("hitung-klasifikasi.js", "uscs", d)


kasus_uscs = [
    # (masukan, simbol, nama ASTM) — diturunkan dari bagan alir ASTM D2487
    ({"P4": 95, "P200": 8, "D10": 0.07, "D30": 0.3, "D60": 0.9, "LL": 30, "PL": 20}, "SW-SC", "Well-graded sand with clay"),
    ({"P4": 100, "P200": 3, "D10": 0.15, "D30": 0.25, "D60": 0.4}, "SP", "Poorly graded sand"),
    ({"P4": 40, "P200": 2, "D10": 0.5, "D30": 3, "D60": 9}, "GW", "Well-graded gravel with sand"),
    ({"P4": 90, "P200": 30, "NP": True}, "SM", "Silty sand"),
    ({"P4": 70, "P200": 20, "LL": 25, "PL": 19}, "SC-SM", "Silty, clayey sand with gravel"),
    ({"P4": 100, "P200": 85, "LL": 45, "PL": 20}, "CL", "Lean clay with sand"),
    ({"P4": 90, "P200": 60, "LL": 60, "PL": 40}, "MH", "Sandy elastic silt"),
    ({"P4": 60, "P200": 55, "LL": 55, "PL": 25}, "CH", "Gravelly fat clay"),
    ({"P4": 97, "P200": 10, "D10": 0.075, "D30": 0.12, "D60": 0.2, "NP": True}, "SP-SM", "Poorly graded sand with silt"),
    ({"P4": 30, "P200": 7, "D10": 0.2, "D30": 2.5, "D60": 12, "LL": 24, "PL": 18}, "GW-GC", "Well-graded gravel with silty clay and sand"),
]
for d, simbol, nama in kasus_uscs:
    r = uscs(d)
    benar(f"USCS {d} → {simbol} (dapat {r.get('simbol')})", r.get("simbol") == simbol)
    benar(f"USCS nama {simbol}: '{nama}' (dapat '{r.get('nama')}')", r.get("nama") == nama)
benar("USCS: F < 5% tanpa D10/D30/D60 ditolak", uscs({"P4": 100, "P200": 3})["galat"])
benar("USCS: F > P4 ditolak", uscs({"P4": 40, "P200": 60, "LL": 30, "PL": 20})["galat"])


# ---------------------------------------------------------------- klasifikasi AASHTO M 145
def gi_acuan(F, LL, IP, kelompok):
    if kelompok in ("A-1-a", "A-1-b", "A-3", "A-2-4", "A-2-5"):
        return 0
    g = 0.01 * (F - 15) * (IP - 10) if kelompok in ("A-2-6", "A-2-7") else (F - 35) * (0.2 + 0.005 * (LL - 40)) + 0.01 * (F - 15) * (IP - 10)
    return max(0, math.floor(g + 0.5))


kasus_aashto = [
    ({"P200": 95, "LL": 60, "PL": 20}, "A-7-6", 42),        # Das: F = 95, LL = 60, IP = 40 → A-7-6(42)
    ({"P200": 38, "LL": 35, "PL": 23}, "A-6", 1),           # Das: F = 38, LL = 35, IP = 12 → A-6(1)
    ({"P200": 30, "P40": 60, "LL": 35, "PL": 20}, "A-2-6", 1),
    ({"P10": 40, "P40": 20, "P200": 10, "NP": True}, "A-1-a", 0),
    ({"P10": 100, "P40": 80, "P200": 5, "NP": True}, "A-3", 0),
    ({"P10": 90, "P40": 45, "P200": 20, "LL": 25, "PL": 21}, "A-1-b", 0),
    ({"P200": 70, "LL": 70, "PL": 44}, "A-7-5", 21),
    ({"P200": 40, "LL": 25, "PL": 20}, "A-4", 0),           # GI negatif → 0
    ({"P200": 60, "LL": 45, "PL": 38}, "A-5", None),
]
for d, kelompok, gi in kasus_aashto:
    r = js("hitung-klasifikasi.js", "aashto", d)
    benar(f"AASHTO {d} → {kelompok} (dapat {r.get('kelompok')})", r.get("kelompok") == kelompok)
    IP = 0 if d.get("NP") else round(d["LL"] - d["PL"])
    acuan = gi_acuan(d["P200"], round(d.get("LL", 0)), IP, kelompok)
    if gi is not None:
        benar(f"GI {kelompok} acuan buku {gi} = rumus {acuan}", gi == acuan)
    benar(f"GI {kelompok}: {acuan} (dapat {r.get('GI')})", r.get("GI") == acuan)
benar("AASHTO: tanah berbutir tanpa lolos No. 40 ditolak", js("hitung-klasifikasi.js", "aashto", {"P200": 20, "LL": 30, "PL": 20})["galat"])


# ---------------------------------------------------------------- hidrometer 152H (ASTM D422)
def visk(T):  # Pa·s, persamaan tipe Vogel
    return 2.414e-5 * 10 ** (247.8 / (T + 273.15 - 140))


def fungsi(modul, nama, *arg):
    skrip = "const m=require(process.argv[1]);console.log(JSON.stringify(m[process.argv[2]](...JSON.parse(process.argv[3]))))"
    return json.loads(subprocess.check_output(["node", "-e", skrip, str(P / modul), nama, json.dumps(arg)], text=True))


for T, acuan in ((20, 1.0016e-3), (25, 0.89002e-3)):  # nilai acuan IAPWS 2008
    cocok(f"viskositas air {T} °C terhadap IAPWS", acuan, fungsi("hitung-hidrometer.js", "viskositasAir", T), tol=1.5e-3)
for Gs, a in ((2.65, 1.00), (2.70, 0.99), (2.80, 0.97), (2.60, 1.01)):  # ASTM D422 Tabel 1 (dua desimal)
    benar(f"faktor a Gs {Gs} ≈ {a}", round(fungsi("hitung-hidrometer.js", "faktorA", Gs), 2) == a)
cocok("L 152H pada R = 0", 16.29, fungsi("hitung-hidrometer.js", "kedalamanL", 0))
cocok("L 152H pada R = 60 (tabel 6,5 cm)", 6.45, fungsi("hitung-hidrometer.js", "kedalamanL", 60))

W, Gs = 50.0, 2.68
bac = [(0.5, 36, 27, 1.5), (1, 34, 27, 1.5), (4, 29, 27, 1.5), (30, 21.5, 28, 1.8), (240, 14.5, 28.5, 1.9), (1440, 9.5, 27, 1.5), (2880, 8, 27, 1.5)]
ayk = [("No. 10", 0.0), ("No. 20", 0.8), ("No. 40", 1.9), ("No. 60", 2.1), ("No. 140", 3.6), ("No. 200", 2.2)]
mm = {"No. 10": 2.0, "No. 20": 0.85, "No. 40": 0.425, "No. 60": 0.25, "No. 140": 0.106, "No. 200": 0.075}
r = js("hitung-hidrometer.js", "hitung", {"W": W, "Gs": Gs, "a": None, "F10": 100, "Cm": 0, "Cd": 0, "batasLempung": 0.002,
                                          "bacaan": [{"no": i + 1, "t": t, "R": R, "T": T, "k": k} for i, (t, R, T, k) in enumerate(bac)],
                                          "ayakan": [{"nama": n, "tertahan": v} for n, v in ayk]})
a = 1.65 * Gs / ((Gs - 1) * 2.65)
titik_h = []
for (t, R, T, k), b in zip(bac, r["bacaan"]):
    L = 16.29 - 0.164 * R
    K = math.sqrt(30 * visk(T) * 10 / (980 * (Gs - rho(T))))
    D = K * math.sqrt(L / t)
    Pp = a * (R + k) / W * 100
    cocok(f"hidrometer t={t}: D", D, b["D"])
    cocok(f"hidrometer t={t}: P", Pp, b["P"])
    titik_h.append((D, Pp))
kum, titik = 0, []
for n, v in ayk:
    kum += v
    titik.append((mm[n], 100 - kum / W * 100))
titik = sorted(titik + titik_h, key=lambda x: -x[0])


def lolos_pada(d):
    for (d1, p1), (d2, p2) in zip(titik, titik[1:]):
        if d1 >= d >= d2:
            return p2 + (math.log10(d) - math.log10(d2)) * (p1 - p2) / (math.log10(d1) - math.log10(d2))


cocok("hidrometer: lolos 0,075 mm", lolos_pada(0.075), r["P200"])
cocok("hidrometer: fraksi lempung < 0,002 mm", lolos_pada(0.002), r["fraksi"]["lempung"])
cocok("hidrometer: fraksi lanau", lolos_pada(0.075) - lolos_pada(0.002), r["fraksi"]["lanau"])
r50 = js("hitung-hidrometer.js", "hitung", {"W": W, "Gs": Gs, "F10": 80, "P4": 90, "batasLempung": 0.002,
                                            "bacaan": [{"no": 1, "t": 2, "R": 30, "T": 25, "k": 0}], "ayakan": []})
cocok("hidrometer: P′ = P × F10/100", r50["bacaan"][0]["P"] * 0.8, r50["bacaan"][0]["Ptotal"])

# ---------------------------------------------------------------- batas susut (SNI 3422:2008)
cw = [{"nama": "1", "W1": 48.62, "W2": 40.15, "W3": 21.34, "V": 15.5, "V0": 10.4}, {"nama": "2", "W1": 49.10, "W2": 40.52, "W3": 21.60, "V": 15.6, "V0": 10.5}]
r = js("hitung-atterberg.js", "batasSusut", {"cawan": cw, "Gs": 2.68})
SL, Rr, SLg = [], [], []
for c in cw:
    Wo = c["W2"] - c["W3"]
    w = (c["W1"] - c["W2"]) / Wo * 100
    SL.append(w - (c["V"] - c["V0"]) / Wo * 100)
    Rr.append(Wo / c["V0"])
    SLg.append((1 / Rr[-1] - 1 / 2.68) * 100)
cocok("batas susut rata-rata", sum(SL) / 2, r["SL"])
cocok("rasio susut rata-rata", sum(Rr) / 2, r["R"])
cocok("batas susut dari Gs", sum(SLg) / 2, r["SLGs"])

# ---------------------------------------------------------------- hubungan fase
r = js("hitung-sifat-fisik.js", "hubunganFase", {"cara": "w-gamma", "Gs": 2.68, "w": 24.5, "gamma": 1.86})
gd = 1.86 / 1.245
e = 2.68 / gd - 1
cocok("fase: γd", gd, r["gammaD"])
cocok("fase: e", e, r["e"])
cocok("fase: Sr", 0.245 * 2.68 / e * 100, r["Sr"])
cocok("fase: γsat", (2.68 + e) / (1 + e), r["gammaSat"])
balik = js("hitung-sifat-fisik.js", "hubunganFase", {"cara": "e-Sr", "Gs": 2.68, "e": r["e"], "Sr": r["Sr"]})
cocok("fase: e–Sr kembali ke w", 24.5, balik["w"])
cocok("fase: e–Sr kembali ke γ", 1.86, balik["gamma"])
cin = js("hitung-sifat-fisik.js", "hubunganFase", {"cara": "cincin", "Gs": 2.68, "w": 24.5, "M": 93.0, "V": 50.0})
cocok("fase: cincin M/V", 93.0 / 50.0, cin["gamma"])

print("\nSemua cocok." if not gagal else f"\n{gagal} pemeriksaan gagal.")
sys.exit(1 if gagal else 0)
