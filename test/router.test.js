// KI-Log B25: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für das Finden der Route zu einer Adresse aus js/router.js (PB-17).
import test from "node:test";
import assert from "node:assert";
import { findeRoute } from "../js/router.js";

test("findeRoute findet feste Pfade ohne Parameter", () => {
  const { route, parameter } = findeRoute("/filme");
  assert.strictEqual(route.geschuetzt, true);
  assert.deepStrictEqual(parameter, {});
  assert.ok(findeRoute("/").route);
  assert.strictEqual(findeRoute("/anmelden").route.nurGaeste, true);
});

test("findeRoute liest die Film-ID aus der Adresse und hält die Seite geschützt", () => {
  const { route, parameter } = findeRoute("/film/157336");
  assert.deepStrictEqual(parameter, { movieId: "157336" });
  assert.strictEqual(route.geschuetzt, true);
});

test("findeRoute markiert bei der Filmseite den Menüpunkt Filme", () => {
  assert.strictEqual(findeRoute("/film/157336").route.menuepunkt, "/filme");
  assert.strictEqual(findeRoute("/filme").route.menuepunkt, undefined);
});

test("findeRoute liefert bei unbekannten Pfaden keine Route", () => {
  assert.strictEqual(findeRoute("/gibtesnicht").route, undefined);
  assert.deepStrictEqual(findeRoute("/gibtesnicht").parameter, {});
});

test("findeRoute lehnt einen leeren Platzhalter und zusätzliche Teile ab", () => {
  assert.strictEqual(findeRoute("/film/").route, undefined);
  assert.strictEqual(findeRoute("/film").route, undefined);
  assert.strictEqual(findeRoute("/film/1/2").route, undefined);
});

test("findeRoute dekodiert den Parameter und lehnt kaputte Kodierung ab", () => {
  assert.deepStrictEqual(findeRoute("/film/12%203").parameter, { movieId: "12 3" });
  assert.strictEqual(findeRoute("/film/%E0%A4%A").route, undefined);
});