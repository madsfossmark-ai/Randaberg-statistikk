// Spor C: LiveKilde og visning. Kjør: node --test tests/live.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('../live/live.js'), F = require('../live/fake-live.js');
const vent = (ms = 30) => new Promise((r) => setTimeout(r, ms));
async function start(k) { const sett = []; const s = await L.LiveKilde({ client: k, contextSlug: 'beta', onData: (d) => sett.push(d), pollMs: 0 }).start(); await vent(); return { s, sett, siste: () => sett[sett.length - 1] }; }

test('øyeblikksbilde, live oppdatering (hendelse/angre/poeng/status) og versjonskontroll', async () => {
  const k = F.klient(), { s, siste } = await start(k);
  assert.equal(siste().length, 1);
  k.oppdater('demo-1', { current: { set: 2, home: 9, away: 6 } });           // poeng
  assert.equal(siste()[0].current.home, 9);
  k.oppdater('demo-1', { status: 'ferdig', current: null });                   // kampstatus
  assert.equal(siste()[0].status, 'ferdig');
  k.gammel('demo-1', { status: 'pågår' });                                     // eldre versjon kommer for sent → ignoreres
  assert.equal(siste()[0].status, 'ferdig');
  s.stopp();
});

test('avpublisering fjerner kampen; reconnect henter nytt øyeblikksbilde', async () => {
  const k = F.klient(), { s, siste } = await start(k);
  k.avpubliser('demo-1'); assert.equal(siste().length, 0);
  k.rader.push(Object.assign(JSON.parse(JSON.stringify({ match_id: 'demo-2', context_slug: 'beta', home: 'Randaberg', away: 'X', status: 'kommende', version: 1, sets: [], players: [] }))));
  k.brudd(); await vent(1300);                                                 // backoff 1 s, så nytt abonnement + øyeblikk
  assert.deepEqual(siste().map((x) => x.match_id), ['demo-2']);
  s.stopp();
});

test('annen kontekst vises ikke (U20 bruker samme kode med annen contextSlug)', async () => {
  const k = F.klient([{ match_id: 'u', context_slug: 'u20', home: 'Norge', away: 'Sverige', status: 'pågår', version: 1, players: [] }]);
  const { s, siste } = await start(k);
  assert.equal(siste().length, 0); s.stopp();
});

test('visning: 0–2 først, volum, lavt volum, serve uten I og ekstern kilde merket', () => {
  const k = F.klient().rader[0];
  k.players.push({ team: 'Randaberg', jersey: '4', name: 'Beta Spiller 4', cat: 'srv', n: 2, ne: 1, nf: 1, avg: 1.5, comparable: false, low_volume: true, source: 'egen' });
  k.external = [{ source: 'NVBF', final: false, partial: true, teams: [] }];
  const h = L.kampKort(k);
  assert.match(h, /<th class="n">Mottak 0–2<\/th><th class="n">Angrep 0–2<\/th><th class="n">Serve 0–2<\/th>/);
  assert.match(h, />1,25<\/span><small>4 · lavt volum/);
  assert.match(h, />0,75</); assert.match(h, />1,00</);
  assert.match(h, /uten I/); assert.doesNotMatch(h, />1,50</);
  assert.match(h, /NVBF-statistikk finnes for kampen \(foreløpig\) – vises separat og regnes ikke om til 0–2/);
  assert.match(h, /Testlag – mottak på vår serve/);
});
