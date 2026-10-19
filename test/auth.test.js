// KI-Log B7: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Token-Verwaltung aus js/auth.js (US-2).
import test from "node:test";
import assert from "node:assert";
import {
  speichereToken,
  holeToken,
  loescheToken,
  istAngemeldet,
} from "../js/auth.js";

// Einfacher Ersatz für localStorage, denn Node hat keinen Browser-Speicher.
// Er kann dasselbe wie localStorage, was auth.js braucht: getItem, setItem, removeItem.
function erzeugeSpeicher() {
  const daten = new Map();
  return {
    getItem: (schluessel) => (daten.has(schluessel) ? daten.get(schluessel) : null),
    setItem: (schluessel, wert) => daten.set(schluessel, String(wert)),
    removeItem: (schluessel) => daten.delete(schluessel),
  };
}

//--> speichereToken und holeToken 

test("holeToken liefert null, wenn noch kein Token gespeichert ist", () => {
  assert.strictEqual(holeToken(erzeugeSpeicher()), null);
});

test("holeToken liefert das gespeicherte Token", () => {
  const speicher = erzeugeSpeicher();
  speichereToken("abc123", speicher);
  assert.strictEqual(holeToken(speicher), "abc123");
});

test("speichereToken überschreibt ein vorhandenes Token", () => {
  const speicher = erzeugeSpeicher();
  speichereToken("alt", speicher);
  speichereToken("neu", speicher);
  assert.strictEqual(holeToken(speicher), "neu");
});

test("speichereToken lehnt leeres Token und Nicht-Text ab", () => {
  const speicher = erzeugeSpeicher();
  assert.throws(() => speichereToken("", speicher));
  assert.throws(() => speichereToken("   ", speicher));
  assert.throws(() => speichereToken(undefined, speicher));
  assert.throws(() => speichereToken(123, speicher));
  assert.strictEqual(holeToken(speicher), null);
});

//--> löescheToken

test("loescheToken entfernt das gespeicherte Token", () => {
  const speicher = erzeugeSpeicher();
  speichereToken("abc123", speicher);
  loescheToken(speicher);
  assert.strictEqual(holeToken(speicher), null);
});

test("loescheToken ohne gespeichertes Token verursacht keinen Fehler", () => {
  assert.doesNotThrow(() => loescheToken(erzeugeSpeicher()));
});

//--> istAngemeldet 

test("istAngemeldet ist false ohne Token", () => {
  assert.strictEqual(istAngemeldet(erzeugeSpeicher()), false);
});

test("istAngemeldet ist true mit Token", () => {
  const speicher = erzeugeSpeicher();
  speichereToken("abc123", speicher);
  assert.strictEqual(istAngemeldet(speicher), true);
});

test("istAngemeldet ist nach dem Abmelden wieder false", () => {
  const speicher = erzeugeSpeicher();
  speichereToken("abc123", speicher);
  loescheToken(speicher);
  assert.strictEqual(istAngemeldet(speicher), false);
});

//--> ohne Speicher (z. B. Browser blockiert localStorage) 

test("ohne Speicher gilt niemand als angemeldet", () => {
  assert.strictEqual(holeToken(null), null);
  assert.strictEqual(istAngemeldet(null), false);
});