# Motion Lab (demo)

Egen testside for animasjoner i Randaberg-statistikk (issue #4). Ligger isolert i `motion-demo/` og påvirker ingen av statistikksidene.

- **Åpne lokalt:** åpne `motion-demo/index.html` i nettleseren. Ingen bygg, ingen avhengigheter.
- **Data:** bare syntetiske data laget i siden (fast frø). Ingen innlogging, Supabase, NVBF eller nettverkskall (bortsett fra skrifttypene fra Google Fonts, som resten av siden).
- **Moduler:** Spillerutvikling, Kampanalyse og Scouting/serveplan.
- **Profiler:** Diskret (ca. 200 ms), Balansert (ca. 350 ms), Dynamisk (ca. 600 ms) og «Spill av igjen».
- **Tilgjengelighet:** følger `prefers-reduced-motion` (kan også slås av og på i siden), tastatur (piltaster mellom faner, Enter/mellomrom på sonene), mørkt og lyst tema.

Teknisk: ren HTML/CSS/JS uten rammeverk, samme stack som statistikksidene. En liten animasjonsmotor (`Motor.tween`) bruker `requestAnimationFrame`, avbryter forrige overgang med samme nøkkel og fortsetter fra verdien som vises, så tall og grafer glir over uten hopp, blinking eller ny oppbygging. Tall bruker en kurve som aldri går forbi sluttverdien. Dynamisk lar bare posisjon og lengde svinge litt forbi.

Når den skal vises på statistikksiden: etter godkjenning merges grenen, og siden ligger på `/motion-demo/`. En lenke «Motion Lab (demo)» kan da legges i bunnteksten på statistikksidene i en egen endring.
