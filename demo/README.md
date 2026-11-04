# Demo med animasjoner

`demo/index.html` er hele statistikksiden (Kamper, Tabell, kampvisning, Dashboard) med oppdiktede data og animasjoner, profil **Balansert** (ca. 350 ms). Den ekte siden i roten er uendret.

- **Data:** `demodata.json`: oppdiktet lag «Hjemmelag», motstandere «Nordlag» osv. og spillere «Spiller En» osv. Ingen databasekall.
- **Animasjoner:** `animasjon.js` legges oppå siden. Etter hver tegning glir tall, stolper og grafer fra forrige verdi til ny, og ny visning tones inn. Sluttverdiene er alltid sidens egne. `prefers-reduced-motion` slår animasjonene av.
- **Bygg på nytt** (etter endringer i den åpne siden): `python3 demo/bygg_demo.py`.
