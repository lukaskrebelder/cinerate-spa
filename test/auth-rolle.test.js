// KI-Log B54: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Speicherung der Rolle aus js/auth.js (PB-34).
import test from "node:test";
import assert from "node:assert";
import {
  ROLLE_NUTZER,
  ROLLE_MODERATOR,
  speichereToken,
  speichereRolle,
  holeRolle,
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

test("die beiden Rollen heißen wie im Backend", () => {
  assert.strictEqual(ROLLE_NUTZER, "Nutzer");
  assert.strictEqual(ROLLE_MODERATOR, "Moderator");
});

test("holeRolle liefert null, wenn noch keine Rolle gespeichert ist", () => {
  assert.strictEqual(holeRolle(erzeugeSpeicher()), null);
});

test("holeRolle liefert die gespeicherte Rolle", () => {
  const speicher = erzeugeSpeicher();
  speichereRolle("Moderator", speicher);
  assert.strictEqual(holeRolle(speicher), "Moderator");
  speichereRolle("Nutzer", speicher);
  assert.strictEqual(holeRolle(speicher), "Nutzer");
});

test("speichereRolle speichert eine fehlende oder unbekannte Rolle nicht und wirft keinen Fehler", () => {
  for (const rolle of [undefined, null, "", "   ", "Admin", "moderator", 1, {}]) {
    const speicher = erzeugeSpeicher();
    speichereRolle(rolle, speicher);
    assert.strictEqual(holeRolle(speicher), null);
  }
});

test("speichereRolle löscht eine alte Rolle, wenn der neue Login keine (gültige) Rolle liefert", () => {
  const speicher = erzeugeSpeicher();
  speichereRolle("Moderator", speicher);
  speichereRolle(undefined, speicher);
  assert.strictEqual(holeRolle(speicher), null);
});

test("holeRolle ignoriert einen unbekannten Wert im Speicher", () => {
  const speicher = erzeugeSpeicher();
  speicher.setItem("cinerate_rolle", "Admin");
  assert.strictEqual(holeRolle(speicher), null);
});

test("loescheToken entfernt auch die gespeicherte Rolle", () => {
  const speicher = erzeugeSpeicher();
  speichereToken("abc123", speicher);
  speichereRolle("Moderator", speicher);
  loescheToken(speicher);
  assert.strictEqual(holeRolle(speicher), null);
});

test("ohne Speicher liefert holeRolle null und speichereRolle wirft keinen Fehler", () => {
  assert.strictEqual(holeRolle(null), null);
  assert.doesNotThrow(() => speichereRolle("Moderator", null));
});