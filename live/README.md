# Live-dashboard V2 (beta, spor C)

Ny, separat visning. **Dagens side (`index.html` + `data.json`) er uendret og fortsatt fallback.** Ingenting her er tatt i bruk på produksjonsadressen.

- `live.js`:
  - `LiveKilde`: første øyebliksbilde av `stats_public.match_live`, så Realtime (`postgres_changes`) med versjonskontroll per kamp, reconnect med backoff (1–30 s) og polling-reserve (15 s).
  - `kampKort`: kamp, sett og stilling, og spillere med **0–2-snitt først** (mottak, angrep, serve, motstanders mottak). Antall forsøk og «lavt volum» vises. Serve uten «I» merkes ikke sammenlignbar. NVBF/CEV vises separat og regnes aldri om til 0–2.
- `index.html`: siden. `config.js` ved siden av gir `{url, key (publishable/anon), contextSlug, title}`. `?lag=<slug>` velger kontekst, og `?demo=1` bruker syntetiske data (`fake-live.js`).
- **Sikkerhet:** leser bare `stats_public.match_live` (bare publiserte aggregater). Ingen rå hendelser, scouting, enhets- eller bruker-ID. Aldri secret key.

## U20
Samme filer. Sett `contextSlug: 'u20-nevza-2026'` (eller konteksten U20 får i V2) og egen tittel i `config.js`, og legg dem i en `live/`-mappe i U20-repoet når det er godkjent.

## Tester
`node --test tests/live.test.mjs` gir 4 tester, alle ok:
- øyeblikksbilde, poeng, kampstatus og eldre versjon ignorert
- avpublisering og reconnect med nytt øyeblikksbilde
- annen kontekst vises ikke
- 0–2 først, volum, serve uten I og ekstern kilde merket

Beta: https://madsfossmark-ai.github.io/Statistikk-V2-beta/live/ (testprosjektet, syntetiske data).
