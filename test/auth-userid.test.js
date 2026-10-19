// KI-Log B6: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Speicherung der Nutzer-ID aus js/auth.js (PB-04).
import test from "node:test";
import assert from "node:assert";
import {
  speichereToken,
  speichereUserId,
  holeUserId,
  loescheToken,
} from "../js/auth.js";

// Einfacher Ersatz für localStorage, denn Node hat keinen Browser-Speicher.
function erzeugeSpeicher() {
  const daten = new Map();
  return {
    getItem: (schluessel) => (daten.has(schluessel) ? daten.get(schluessel) : null),
    setItem: (schluessel, wert) => daten.set(schluessel, String(wert)),
    removeItem: (schluessel) => daten.delete(schluessel),
  };
}

test("holeUserId liefert null, wenn noch keine ID gespeichert ist", () => {
  assert.strictEqual(holeUserId(erzeugeSpeicher()), null);
});

test("holeUserId liefert die gespeicherte ID unverändert als Text", () => {
  const speicher = erzeugeSpeicher();
  speichereUserId("u_67", speicher);
  assert.strictEqual(holeUserId(speicher), "u_67");
});

test("speichereUserId speichert eine fehlende oder leere ID nicht und wirft keinen Fehler", () => {
  const speicher = erzeugeSpeicher();
  speichereUserId(undefined, speicher);
  speichereUserId("", speicher);
  speichereUserId("   ", speicher);
  speichereUserId(67, speicher);
  assert.strictEqual(holeUserId(speicher), null);
});

test("speichereUserId überschreibt eine vorhandene ID", () => {
  const speicher = erzeugeSpeicher();
  speichereUserId("u_1", speicher);
  speichereUserId("u_2", speicher);
  assert.strictEqual(holeUserId(speicher), "u_2");
});

test("loescheToken entfernt auch die gespeicherte Nutzer-ID", () => {
  const speicher = erzeugeSpeicher();
  speichereToken("abc123", speicher);
  speichereUserId("u_67", speicher);
  loescheToken(speicher);
  assert.strictEqual(holeUserId(speicher), null);
});