//Unit-Tests aus zeitlihen Gründen mithilfe von KI (CLAUDE Sonett 5.5) erstellt 
// Unit-Tests für die Hilfsfunktionen der Filmsuche aus js/views/filme.js (US-5).
import test from "node:test";
import assert from "node:assert";
import { uebersetzeSuchfehler, istSichereBildUrl, bestimmeSeitenanzeige } from "../js/views/filme.js";
import { GENRES } from "../js/genres.js";

//--> übersetzeSuchfehler

test("uebersetzeSuchfehler meldet bei 400 falsche Eingaben", () => {
  assert.strictEqual(uebersetzeSuchfehler(400), "Bitte prüfe deine Eingaben.");
});

test("uebersetzeSuchfehler meldet bei 0, 502 und 503 einen nicht erreichbaren Server", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  assert.strictEqual(uebersetzeSuchfehler(0), erwartet);
  assert.strictEqual(uebersetzeSuchfehler(502), erwartet);
  assert.strictEqual(uebersetzeSuchfehler(503), erwartet);
});

test("uebersetzeSuchfehler hat für andere Status einen allgemeinen Text", () => {
  assert.strictEqual(
    uebersetzeSuchfehler(500),
    "Die Suche ist fehlgeschlagen. Bitte versuche es später noch einmal."
  );
});

//--> istSichereBildUrl

test("istSichereBildUrl akzeptiert Adressen von TMDB", () => {
  assert.strictEqual(istSichereBildUrl("https://image.tmdb.org/t/p/w500/abc.jpg"), true);
});

test("istSichereBildUrl lehnt fremde Adressen, unsichere Adressen und Nicht-Text ab", () => {
  assert.strictEqual(istSichereBildUrl("https://evil.example.com/bild.jpg"), false);
  assert.strictEqual(istSichereBildUrl("http://image.tmdb.org/t/p/w500/abc.jpg"), false);
  assert.strictEqual(istSichereBildUrl("javascript:alert(1)"), false);
  assert.strictEqual(istSichereBildUrl(null), false);
  assert.strictEqual(istSichereBildUrl(undefined), false);
});

//--> bestimmeSeitenanzeige

test("bestimmeSeitenanzeige zeigt auf der ersten Seite nur Weiter", () => {
  assert.deepStrictEqual(bestimmeSeitenanzeige(1, 5), { text: "Seite 1 von 5", hatZurueck: false, hatWeiter: true });
});

test("bestimmeSeitenanzeige zeigt in der Mitte Zurück und Weiter", () => {
  assert.deepStrictEqual(bestimmeSeitenanzeige(3, 5), { text: "Seite 3 von 5", hatZurueck: true, hatWeiter: true });
});

test("bestimmeSeitenanzeige zeigt auf der letzten Seite nur Zurück", () => {
  assert.deepStrictEqual(bestimmeSeitenanzeige(5, 5), { text: "Seite 5 von 5", hatZurueck: true, hatWeiter: false });
});

test("bestimmeSeitenanzeige geht bei nur einer Seite oder ungültiger Gesamtzahl von einer Seite aus", () => {
  assert.deepStrictEqual(bestimmeSeitenanzeige(1, 1), { text: "Seite 1 von 1", hatZurueck: false, hatWeiter: false });
  assert.deepStrictEqual(bestimmeSeitenanzeige(1, 0), { text: "Seite 1 von 1", hatZurueck: false, hatWeiter: false });
  assert.deepStrictEqual(bestimmeSeitenanzeige(1, undefined), { text: "Seite 1 von 1", hatZurueck: false, hatWeiter: false });
});

//--> GENRES

test("Die Genreliste enthält keine Doppelten und keine leeren Namen", () => {
  assert.strictEqual(new Set(GENRES).size, GENRES.length);
  assert.ok(GENRES.every((name) => name.trim() !== ""));
  assert.ok(GENRES.includes("Science Fiction"));
});