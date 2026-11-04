#!/usr/bin/env python3
"""Bygger demo/index.html: hele statistikksiden med oppdiktede data og animasjoner (Balansert).

    python3 demo/bygg_demo.py

Kilde er ../index.html (Randaberg damer), så demoen følger samme versjon som den åpne siden.
Endringer i forhold til den åpne siden:
  * dataene kommer fra demo/demodata.json (oppdiktet lag «Hjemmelag», «Spiller En» osv.), ingen nettverkskall
  * tydelig DEMO-merking og egen fottekst
  * demo/animasjon.js legges inn (overganger, opptelling, stolper og grafer)
Ingen andre filer endres.
"""
import json, pathlib, re, sys

D = pathlib.Path(__file__).resolve().parent
ROT = D.parent
side = (ROT / "index.html").read_text(encoding="utf-8")
data = json.loads((D / "demodata.json").read_text(encoding="utf-8"))
anim = (D / "animasjon.js").read_text(encoding="utf-8")

def bytt(gammel, ny, s):
    if s.count(gammel) != 1:
        sys.exit("Fant ikke (nøyaktig én gang): " + gammel[:80])
    return s.replace(gammel, ny)

# 1) Oppdiktet lag og sesong
side = bytt("window.PUBLIC_CTX = null;",
            "window.PUBLIC_CTX = " + json.dumps({"id": "main", "name": "Hjemmelag · Demoserien 26/27 (oppdiktet)", "our": "Hjemmelag", "prefix": "",
                                                 "teams": ["Nordlag", "Vestlag", "Sørlag", "Østlag", "Motlag"]}, ensure_ascii=False) + ";", side)

# 2) Data fra filen i stedet for databasen
start = side.index("  const dataP = fetch(")
slutt = side.index("\n", start)
side = side[:start] + ("  const dataP = Promise.resolve(window.DEMO_EKSPORT).then((D) => { window.PUBLIC_UPDATED = 'demodata'; "
                       "const f = document.getElementById('pub-oppdatert'); if (f) f.textContent = 'demodata'; return D; });") + side[slutt:]
if "rpc/public_export" in side:
    sys.exit("Demoen inneholder fortsatt databasekallet.")

# 3) Data og animasjoner før sidens skript
merke = "<script>\n/* Lesemodus: erstatter Claude-lagringen med data.json */"
side = bytt(merke, "<script>window.DEMO_EKSPORT = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";</script>\n<script>\n" + anim + "\n</script>\n" + merke, side)

# 4) Merking og fottekst
side = bytt('<footer class="pub-foot">Statistikk ført fra benken av Randaberg Volleyball. Andre lags kamper fra NVBF. Oppdatert <span id="pub-oppdatert">…</span>. Beta: tallene hentes direkte fra den nye databasen.</footer>',
            '<footer class="pub-foot">Demo med oppdiktede lag, spillere og tall (<span id="pub-oppdatert">demodata</span>). Ikke offisiell kampstatistikk. '
            '<a href="../">Til den ekte statistikksiden</a>.</footer>', side)
side = re.sub(r"<title>[^<]*</title>", "<title>DEMO · Kampstatistikk</title>", side, count=1)
# Fast DEMO-merke øverst, som i appens demomodus
side = bytt('<div class="app" id="app">', '<div class="demo-merke" role="note">DEMO · oppdiktede data, ikke offisiell statistikk</div>\n<div class="app" id="app">', side)
side = side.replace("</style>", ".demo-merke { position: fixed; top: env(safe-area-inset-top, 0px); left: 50%; transform: translateX(-50%); z-index: 50; font: 700 12px var(--font-body); padding: 4px 12px; border-radius: 0 0 10px 10px; background: #5B3A9E; color: #fff; white-space: nowrap; pointer-events: none; }\n</style>", 1)
(D / "index.html").write_text(side, encoding="utf-8")
print("demo/index.html", len(side) // 1024, "KB")
