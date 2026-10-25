// KI-Log B27: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Hilfsfunktionen des Bewertungsbereichs aus js/views/bewertung.js (PB-18 bis PB-20).
import test from "node:test";
import assert from "node:assert";
import {
  istGueltigeSterne,
  formatiereDurchschnitt,
  formatiereEigeneBewertung,
  bestimmeGefuellteSterne,
  bestimmeBestaetigung,
  uebersetzeBewertungsfehler,
} from "../js/views/bewertung.js";

//--> istGueltigeSterne

test("istGueltigeSterne akzeptiert die ganzen Zahlen von 1 bis 5", () => {
  for (const sterne of [1, 2, 3, 4, 5]) assert.strictEqual(istGueltigeSterne(sterne), true);
});

test("istGueltigeSterne lehnt alles andere ab", () => {
  assert.strictEqual(istGueltigeSterne(0), false);
  assert.strictEqual(istGueltigeSterne(6), false);
  assert.strictEqual(istGueltigeSterne(-1), false);
  assert.strictEqual(istGueltigeSterne(3.5), false);
  assert.strictEqual(istGueltigeSterne("3"), false);
  assert.strictEqual(istGueltigeSterne(null), false);
  assert.strictEqual(istGueltigeSterne(undefined), false);
  assert.strictEqual(istGueltigeSterne(NaN), false);
});

//--> formatiereDurchschnitt

test("formatiereDurchschnitt zeigt den Durchschnitt mit Komma und die Anzahl", () => {
  assert.strictEqual(formatiereDurchschnitt(4.5, 2), "4,5 von 5 (2 Bewertungen)");
  assert.strictEqual(formatiereDurchschnitt(5, 12), "5,0 von 5 (12 Bewertungen)");
});

test("formatiereDurchschnitt benutzt bei genau einer Bewertung die Einzahl", () => {
  assert.strictEqual(formatiereDurchschnitt(4, 1), "4,0 von 5 (1 Bewertung)");
});

test("formatiereDurchschnitt sagt ohne Bewertung, dass es noch keine gibt", () => {
  assert.strictEqual(formatiereDurchschnitt(null, 0), "Noch keine Bewertungen");
  assert.strictEqual(formatiereDurchschnitt(undefined, undefined), "Noch keine Bewertungen");
  assert.strictEqual(formatiereDurchschnitt(NaN, 3), "Noch keine Bewertungen");
  assert.strictEqual(formatiereDurchschnitt(4.5, 0), "Noch keine Bewertungen");
});

//--> formatiereEigeneBewertung

test("formatiereEigeneBewertung zeigt die eigenen Sterne", () => {
  assert.strictEqual(formatiereEigeneBewertung(4), "Deine Bewertung: 4 Sterne");
  assert.strictEqual(formatiereEigeneBewertung(1), "Deine Bewertung: 1 Stern");
});

test("formatiereEigeneBewertung weist ohne eigene Bewertung darauf hin", () => {
  assert.strictEqual(formatiereEigeneBewertung(null), "Du hast diesen Film noch nicht bewertet.");
  assert.strictEqual(formatiereEigeneBewertung(undefined), "Du hast diesen Film noch nicht bewertet.");
  assert.strictEqual(formatiereEigeneBewertung(7), "Du hast diesen Film noch nicht bewertet.");
});

//--> bestimmeGefuellteSterne

test("bestimmeGefuellteSterne füllt so viele Sterne, wie bewertet wurde", () => {
  assert.deepStrictEqual(bestimmeGefuellteSterne(3), [true, true, true, false, false]);
  assert.deepStrictEqual(bestimmeGefuellteSterne(1), [true, false, false, false, false]);
  assert.deepStrictEqual(bestimmeGefuellteSterne(5), [true, true, true, true, true]);
});

test("bestimmeGefuellteSterne lässt ohne gültige Bewertung alle Sterne leer", () => {
  const leer = [false, false, false, false, false];
  assert.deepStrictEqual(bestimmeGefuellteSterne(null), leer);
  assert.deepStrictEqual(bestimmeGefuellteSterne(0), leer);
  assert.deepStrictEqual(bestimmeGefuellteSterne(9), leer);
});

//--> bestimmeBestaetigung

test("bestimmeBestaetigung unterscheidet eine neue von einer geänderten Bewertung", () => {
  assert.strictEqual(bestimmeBestaetigung(false), "Danke für deine Bewertung!");
  assert.strictEqual(bestimmeBestaetigung(true), "Deine Bewertung wurde geändert.");
});

//--> uebersetzeBewertungsfehler

test("uebersetzeBewertungsfehler meldet bei 400 ungültige Sterne und bei 404 einen unbekannten Film", () => {
  assert.strictEqual(uebersetzeBewertungsfehler(400), "Bitte wähle 1 bis 5 Sterne.");
  assert.strictEqual(uebersetzeBewertungsfehler(404), "Diesen Film gibt es nicht.");
});

test("uebersetzeBewertungsfehler meldet bei 0, 502 und 503 einen nicht erreichbaren Server", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  assert.strictEqual(uebersetzeBewertungsfehler(0), erwartet);
  assert.strictEqual(uebersetzeBewertungsfehler(502, "laden"), erwartet);
  assert.strictEqual(uebersetzeBewertungsfehler(503), erwartet);
});

test("uebersetzeBewertungsfehler hat für andere Status je nach Aktion einen allgemeinen Text", () => {
  assert.strictEqual(
    uebersetzeBewertungsfehler(500, "speichern"),
    "Deine Bewertung konnte nicht gespeichert werden. Bitte versuche es später noch einmal."
  );
  assert.strictEqual(
    uebersetzeBewertungsfehler(500, "laden"),
    "Die Bewertungen konnten nicht geladen werden. Bitte versuche es später noch einmal."
  );
  assert.strictEqual(
    uebersetzeBewertungsfehler(500),
    "Deine Bewertung konnte nicht gespeichert werden. Bitte versuche es später noch einmal."
  );
});