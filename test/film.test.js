// KI-Log B24: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Hilfsfunktionen der Filmdetailseite aus js/views/film.js (PB-17).
import test from "node:test";
import assert from "node:assert";
import {
  istGueltigeFilmId,
  uebersetzeDetailfehler,
  formatiereLaufzeit,
  formatiereFsk,
  bestimmeDetails,
} from "../js/views/film.js";

//--> istGueltigeFilmId

test("istGueltigeFilmId akzeptiert ganze Zahlen ab 1 als Text", () => {
  assert.strictEqual(istGueltigeFilmId("157336"), true);
  assert.strictEqual(istGueltigeFilmId("1"), true);
});

test("istGueltigeFilmId lehnt alles andere ab", () => {
  assert.strictEqual(istGueltigeFilmId("0"), false);
  assert.strictEqual(istGueltigeFilmId("-5"), false);
  assert.strictEqual(istGueltigeFilmId("12.5"), false);
  assert.strictEqual(istGueltigeFilmId("abc"), false);
  assert.strictEqual(istGueltigeFilmId("12abc"), false);
  assert.strictEqual(istGueltigeFilmId(""), false);
  assert.strictEqual(istGueltigeFilmId("99999999999999999999"), false);
  assert.strictEqual(istGueltigeFilmId(157336), false);      // die ID aus der Adresse ist immer Text
  assert.strictEqual(istGueltigeFilmId(undefined), false);
});

//--> uebersetzeDetailfehler

test("uebersetzeDetailfehler meldet bei 404, dass es den Film nicht gibt", () => {
  assert.strictEqual(uebersetzeDetailfehler(404), "Diesen Film gibt es nicht.");
});

test("uebersetzeDetailfehler meldet bei 0, 502 und 503 einen nicht erreichbaren Server", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  assert.strictEqual(uebersetzeDetailfehler(0), erwartet);
  assert.strictEqual(uebersetzeDetailfehler(502), erwartet);
  assert.strictEqual(uebersetzeDetailfehler(503), erwartet);
});

test("uebersetzeDetailfehler hat für andere Status einen allgemeinen Text", () => {
  assert.strictEqual(
    uebersetzeDetailfehler(500),
    "Der Film konnte nicht geladen werden. Bitte versuche es später noch einmal."
  );
});

//--> formatiereLaufzeit

test("formatiereLaufzeit zeigt Stunden und Minuten", () => {
  assert.strictEqual(formatiereLaufzeit(169), "2 h 49 min");
  assert.strictEqual(formatiereLaufzeit(61), "1 h 1 min");
});

test("formatiereLaufzeit lässt bei vollen Stunden die Minuten weg und bei kurzen Filmen die Stunden", () => {
  assert.strictEqual(formatiereLaufzeit(120), "2 h");
  assert.strictEqual(formatiereLaufzeit(45), "45 min");
});

test("formatiereLaufzeit meldet fehlende oder ungültige Werte als Keine Angabe", () => {
  assert.strictEqual(formatiereLaufzeit(null), "Keine Angabe");
  assert.strictEqual(formatiereLaufzeit(undefined), "Keine Angabe");
  assert.strictEqual(formatiereLaufzeit(0), "Keine Angabe");
  assert.strictEqual(formatiereLaufzeit(-10), "Keine Angabe");
  assert.strictEqual(formatiereLaufzeit(90.5), "Keine Angabe");
});

//--> formatiereFsk

test("formatiereFsk zeigt die Altersfreigabe", () => {
  assert.strictEqual(formatiereFsk(0), "FSK 0");
  assert.strictEqual(formatiereFsk(12), "FSK 12");
  assert.strictEqual(formatiereFsk(18), "FSK 18");
});

test("formatiereFsk meldet fehlende oder unbekannte Werte als Keine Angabe", () => {
  assert.strictEqual(formatiereFsk(null), "Keine Angabe");
  assert.strictEqual(formatiereFsk(undefined), "Keine Angabe");
  assert.strictEqual(formatiereFsk(14), "Keine Angabe");
  assert.strictEqual(formatiereFsk("12"), "Keine Angabe");
});

//--> bestimmeDetails

test("bestimmeDetails liefert die drei Eckdaten in fester Reihenfolge", () => {
  const film = { releaseYear: 2014, runtime: 169, fsk: 12 };
  assert.deepStrictEqual(bestimmeDetails(film), [
    { bezeichnung: "Erscheinungsjahr", wert: "2014" },
    { bezeichnung: "Laufzeit", wert: "2 h 49 min" },
    { bezeichnung: "Altersfreigabe", wert: "FSK 12" },
  ]);
});

test("bestimmeDetails kommt mit fehlenden Angaben (null) zurecht", () => {
  const film = { releaseYear: null, runtime: null, fsk: null };
  assert.deepStrictEqual(
    bestimmeDetails(film).map((d) => d.wert),
    ["Keine Angabe", "Keine Angabe", "Keine Angabe"]
  );
});