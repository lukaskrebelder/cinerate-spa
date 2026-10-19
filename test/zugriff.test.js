// KI-Log B13: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für den Zugriffsschutz aus js/zugriff.js (PB-12).
import test from "node:test";
import assert from "node:assert";
import { pruefeZugriff, setzeHinweis, holeHinweis } from "../js/zugriff.js";

//--> prüfeZugriff

test("pruefeZugriff schickt Gäste von geschützten Seiten zur Anmeldung", () => {
  assert.strictEqual(pruefeZugriff({ geschuetzt: true }, false), "/anmelden");
});

test("pruefeZugriff lässt angemeldete Nutzer auf geschützte Seiten", () => {
  assert.strictEqual(pruefeZugriff({ geschuetzt: true }, true), null);
});

test("pruefeZugriff schickt angemeldete Nutzer von Gast-Seiten zur Startseite", () => {
  assert.strictEqual(pruefeZugriff({ nurGaeste: true }, true), "/");
});

test("pruefeZugriff lässt Gäste auf Gast-Seiten", () => {
  assert.strictEqual(pruefeZugriff({ nurGaeste: true }, false), null);
});

test("pruefeZugriff lässt jeden auf Seiten ohne Einschränkung", () => {
  assert.strictEqual(pruefeZugriff({}, true), null);
  assert.strictEqual(pruefeZugriff({}, false), null);
});

test("pruefeZugriff lässt unbekannte Seiten durch, damit die Seite 'nicht gefunden' erscheint", () => {
  assert.strictEqual(pruefeZugriff(undefined, false), null);
  assert.strictEqual(pruefeZugriff(undefined, true), null);
});

//--> Hinweis

test("holeHinweis liefert den gesetzten Hinweis und danach nichts mehr", () => {
  setzeHinweis("Bitte melde dich an.");
  assert.strictEqual(holeHinweis(), "Bitte melde dich an.");
  assert.strictEqual(holeHinweis(), null);
});

test("holeHinweis liefert null, wenn kein Hinweis gesetzt wurde", () => {
  assert.strictEqual(holeHinweis(), null);
});