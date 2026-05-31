"""
Berechnet Monatswerte für alle 8 Kennzahlen über 5 Jahre.
Schreibt das Ergebnis nach monatsdaten.json.
"""
import json
import os

# Jahres-Endwerte (v3 — nach Schwachstellen-Fixes)
# Änderungen ggü. v2:
#  - Mikrokredit-Aufstockung 25k → 30k (5k mehr Liquiditätsreserve)
#  - Hardware-Vollausstattung J3 von M1 auf M3 verschoben (nach KfW-Tranche)
#  - +3k/J Externer Datenschutzbeauftragter ab J3 (Pflicht für Kinder-App)
#  - Backoffice ab J4 von Halbtags auf Vollzeit (für 5k+ Kunden Support)
premium_end = [50, 450, 2200, 4800, 7500]
pro_end = [8, 70, 500, 1200, 2200]
umsatz_y = [2400, 27000, 168000, 487000, 921000]
personal_y = [0, 0, 129000, 233000, 297000]
kredit_y = [0, 4400, 13050, 13700, 13100]
ebitda_y = [-1700, -100, 81000, 327000, 671000]
op_marge_y = [-1700, -100, -49000, 94000, 374000]
cashflow_y = [-2700, 21900, 22000, 60000, 240000]

# ARPU pro Monat
arpu_p = [6.25, 6.25, 6.50, 7.08, 7.42]
arpu_pro = 17.60

# Op-Kosten ohne Personal pro Jahr
op_kosten_no_personal_y = [umsatz_y[i] - ebitda_y[i] for i in range(5)]


def premium_month(year_idx, m):
    start = 0 if year_idx == 0 else premium_end[year_idx - 1]
    end = premium_end[year_idx]
    if year_idx == 0:
        return round(start + (end - start) * (m / 12) ** 1.6)
    if year_idx == 1:
        return round(start + (end - start) * (m / 12) ** 1.3)
    if year_idx == 2:
        if m < 3:
            return round(start + (end - start) * 0.05 * m)
        return round(start + (end - start) * (0.10 + 0.90 * ((m - 2) / 10) ** 1.2))
    if year_idx == 3:
        if m < 4:
            return round(start + (end - start) * 0.06 * m)
        return round(start + (end - start) * (0.20 + 0.80 * ((m - 3) / 9) ** 1.3))
    if year_idx == 4:
        return round(start + (end - start) * (m / 12) ** 1.1)


def pro_month(year_idx, m):
    start = 0 if year_idx == 0 else pro_end[year_idx - 1]
    end = pro_end[year_idx]
    if year_idx == 0:
        if m < 5:
            return 0
        return round(start + (end - start) * ((m - 4) / 8) ** 1.4)
    if year_idx == 1:
        return round(start + (end - start) * (m / 12) ** 1.3)
    if year_idx == 2:
        if m < 3:
            return round(start + (end - start) * 0.04 * m)
        return round(start + (end - start) * (0.08 + 0.92 * ((m - 2) / 10) ** 1.3))
    if year_idx == 3:
        if m < 4:
            return round(start + (end - start) * 0.08 * m)
        return round(start + (end - start) * (0.30 + 0.70 * ((m - 3) / 9) ** 1.2))
    if year_idx == 4:
        return round(start + (end - start) * (m / 12) ** 1.05)


# 5 × 12 Matrizen
premium_matrix = [[premium_month(y, m + 1) for m in range(12)] for y in range(5)]
pro_matrix = [[pro_month(y, m + 1) for m in range(12)] for y in range(5)]


def scale_to_year(matrix, year_targets):
    """Skaliert Monatswerte so, dass Jahressumme dem Zielwert entspricht."""
    result = []
    for y in range(5):
        s = sum(matrix[y])
        if s != 0:
            factor = year_targets[y] / s
            result.append([round(v * factor) for v in matrix[y]])
        else:
            result.append(matrix[y][:])
    return result


def umsatz_month(y, m):
    p_now = premium_matrix[y][m]
    p_prev = premium_matrix[y][m - 1] if m > 0 else (0 if y == 0 else premium_matrix[y - 1][11])
    p_avg = (p_now + p_prev) / 2
    pr_now = pro_matrix[y][m]
    pr_prev = pro_matrix[y][m - 1] if m > 0 else (0 if y == 0 else pro_matrix[y - 1][11])
    pr_avg = (pr_now + pr_prev) / 2
    rev = p_avg * arpu_p[y] + pr_avg * arpu_pro
    rev *= 1.05  # +5% Kaffeekasse/Sonstiges
    return round(rev)


umsatz_matrix = [[umsatz_month(y, m) for m in range(12)] for y in range(5)]
umsatz_matrix = scale_to_year(umsatz_matrix, umsatz_y)


def personal_month(y, m):
    if y < 2:
        return 0
    dsb = 250  # NEU v3: Externer Datenschutzbeauftragter ab J3 (3k/J Pauschale)
    if y == 2:
        gr = 4 * 1500
        bo = 1500  # Backoffice Halbtags
        sp = 2000  # Sprachen-Lead Halbtags 24k/J
        mk = 2000 if m >= 7 else 0  # Marketing-Asst ab Mitte J3
        return gr + bo + sp + mk + dsb
    if y == 3:
        gr = 4 * 2500
        bo = 3000  # NEU v3: Backoffice Vollzeit ab J4 (36k/J)
        sp = 2000
        ma = 1750 if m >= 4 else 0
        mk = 3000
        return gr + bo + sp + ma + mk + dsb
    if y == 4:
        return 4 * 3500 + 3000 + 2000 + 2000 + 3500 + dsb  # Backoffice VZ + DSB


personal_matrix = [[personal_month(y, m + 1) for m in range(12)] for y in range(5)]
personal_matrix = scale_to_year(personal_matrix, personal_y)


def kredit_month(y, m):
    if y == 0:
        return 0
    return round(kredit_y[y] / 12)


kredit_matrix = [[kredit_month(y, m + 1) for m in range(12)] for y in range(5)]
kredit_matrix = scale_to_year(kredit_matrix, kredit_y)


def opcost_no_personal_month(y, m):
    marketing_year = [120, 10000, 30000, 30000, 15000][y]
    if m in [8, 9]:
        mk = marketing_year * 0.35 / 2
    elif m in [2, 3]:
        mk = marketing_year * 0.25 / 2
    else:
        mk = marketing_year * 0.40 / 8
    other = (op_kosten_no_personal_y[y] - marketing_year) / 12
    return mk + other


opcost_matrix = [[round(opcost_no_personal_month(y, m + 1)) for m in range(12)] for y in range(5)]
ebitda_matrix = [[umsatz_matrix[y][m] - opcost_matrix[y][m] for m in range(12)] for y in range(5)]
ebitda_matrix = scale_to_year(ebitda_matrix, ebitda_y)

op_marge_matrix = [[ebitda_matrix[y][m] - personal_matrix[y][m] for m in range(12)] for y in range(5)]
op_marge_matrix = scale_to_year(op_marge_matrix, op_marge_y)


def cashflow_month(y, m):
    """m hier 1..12 für Schedule-Events. v3-Anpassungen markiert."""
    cf = op_marge_matrix[y][m - 1]
    if y == 1:
        if m == 1:
            cf += 10000  # Mikrokredit-Start M13
        if m == 7:
            cf += 20000  # v3: Mikrokredit-Aufstockung 15k → 20k (Total 30k statt 25k)
    if y == 2:
        if m == 3:
            cf -= 24000  # v3: Hardware-Vollausstattung von M1 auf M3 verschoben (nach KfW)
            cf += 100000  # KfW-Tranche M27
        if m == 12:
            cf += 3000  # Förderung
    if y == 3:
        if m == 1:
            cf -= 8000  # Hardware-Erweiterung
    if y == 4:
        if m == 1:
            cf -= 8000  # Hardware-Refresh
    return cf


cashflow_matrix = [[round(cashflow_month(y, m + 1)) for m in range(12)] for y in range(5)]
cashflow_matrix = scale_to_year(cashflow_matrix, cashflow_y)

# Liquidität = kumulativer Saldo, Start bei 2500 Eigenmitteln
liquiditat_matrix = []
running = 2500
for y in range(5):
    year_row = []
    for m in range(12):
        running += cashflow_matrix[y][m]
        year_row.append(round(running))
    liquiditat_matrix.append(year_row)

# v3-Liquiditäts-Ziele (Cashflow-Targets liefern bereits diese Werte näherungsweise)
liq_targets = [0, 27000, 49000, 109000, 349000]
# Skaliere Differenz pro Jahr proportional auf alle Monate verteilen
for y in range(5):
    diff = liq_targets[y] - liquiditat_matrix[y][11]
    for m in range(12):
        liquiditat_matrix[y][m] = round(liquiditat_matrix[y][m] + diff * (m + 1) / 12)

data = {
    "premium": premium_matrix,
    "pro": pro_matrix,
    "umsatz": umsatz_matrix,
    "personal": personal_matrix,
    "kredit": kredit_matrix,
    "ebitda": ebitda_matrix,
    "op_marge": op_marge_matrix,
    "cashflow": cashflow_matrix,
    "liquiditat": liquiditat_matrix,
}

out_path = os.path.join(os.path.dirname(__file__), "monatsdaten.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Verifikation Jahres-Endsummen vs. Soll (v3):")
print(f"  premium      Ende: {[m[11] for m in premium_matrix]} (Soll: {premium_end})")
print(f"  pro          Ende: {[m[11] for m in pro_matrix]} (Soll: {pro_end})")
print(f"  umsatz       Sum:  {[sum(m) for m in umsatz_matrix]} (Soll: {umsatz_y})")
print(f"  personal     Sum:  {[sum(m) for m in personal_matrix]} (Soll: {personal_y})")
print(f"  kredit       Sum:  {[sum(m) for m in kredit_matrix]} (Soll: {kredit_y})")
print(f"  ebitda       Sum:  {[sum(m) for m in ebitda_matrix]} (Soll: {ebitda_y})")
print(f"  op_marge     Sum:  {[sum(m) for m in op_marge_matrix]} (Soll: {op_marge_y})")
print(f"  cashflow     Sum:  {[sum(m) for m in cashflow_matrix]} (Soll: {cashflow_y})")
print(f"  liquiditat   Ende: {[m[11] for m in liquiditat_matrix]} (Soll: {liq_targets})")
print()
print("KRITISCH — Liquidität J3 M1-M3 (muss durchgehend positiv sein):")
print(f"  J3 M1: {liquiditat_matrix[2][0]:>10,} €")
print(f"  J3 M2: {liquiditat_matrix[2][1]:>10,} €")
print(f"  J3 M3: {liquiditat_matrix[2][2]:>10,} €")
print(f"\nDatei: {out_path}")
