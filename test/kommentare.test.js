// KI-Log B50: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Hilfsfunktionen des Kommentarbereichs aus js/views/kommentare.js (PB-32, PB-33 und PB-35).
import test from "node:test";
import assert from "node:assert";
import {
  MAX_KOMMENTAR_LAENGE,
  pruefeKommentartext,
  formatiereZeichenzaehler,
  formatiereZeitpunkt,
  formatiereKommentarzeit,
  bestimmeKommentarrechte,
  bestimmeZielseite,
  uebersetzeKommentarfehler,
} from "../js/views/kommentare.js";

//--> pruefeKommentartext

test("pruefeKommentartext akzeptiert einen normalen Text und kürzt Leerzeichen am Rand", () => {
  assert.deepStrictEqual(pruefeKommentartext("Toller Film"), { text: "Toller Film", fehler: null });
  assert.deepStrictEqual(pruefeKommentartext("  Toller Film \n"), { text: "Toller Film", fehler: null });
});

test("pruefeKommentartext lässt Zeilenumbrüche mitten im Text stehen", () => {
  assert.strictEqual(pruefeKommentartext("Zeile 1\nZeile 2").text, "Zeile 1\nZeile 2");
});

test("pruefeKommentartext lehnt leeren Text und reine Leerzeichen ab", () => {
  for (const eingabe of ["", "   ", "\n\t "]) {
    const ergebnis = pruefeKommentartext(eingabe);
    assert.strictEqual(ergebnis.fehler, "Bitte schreibe einen Kommentar.");
    assert.strictEqual(ergebnis.text, "");
  }
});

test("pruefeKommentartext lehnt etwas, das kein Text ist, ab", () => {
  for (const eingabe of [null, undefined, 42, {}]) {
    assert.strictEqual(pruefeKommentartext(eingabe).fehler, "Bitte schreibe einen Kommentar.");
  }
});

test("pruefeKommentartext erlaubt genau 500 Zeichen und lehnt 501 ab", () => {
  assert.strictEqual(MAX_KOMMENTAR_LAENGE, 500);
  assert.strictEqual(pruefeKommentartext("a".repeat(500)).fehler, null);
  assert.strictEqual(
    pruefeKommentartext("a".repeat(501)).fehler,
    "Ein Kommentar darf höchstens 500 Zeichen lang sein."
  );
});

test("pruefeKommentartext zählt Leerzeichen am Rand nicht mit", () => {
  assert.strictEqual(pruefeKommentartext(`  ${"a".repeat(500)}  `).fehler, null);
});

//--> formatiereZeichenzaehler

test("formatiereZeichenzaehler zeigt die Länge und das Maximum", () => {
  assert.strictEqual(formatiereZeichenzaehler(""), "0 / 500");
  assert.strictEqual(formatiereZeichenzaehler("Hallo"), "5 / 500");
  assert.strictEqual(formatiereZeichenzaehler("a".repeat(500)), "500 / 500");
});

test("formatiereZeichenzaehler behandelt etwas, das kein Text ist, wie einen leeren Text", () => {
  assert.strictEqual(formatiereZeichenzaehler(null), "0 / 500");
  assert.strictEqual(formatiereZeichenzaehler(undefined), "0 / 500");
});

//--> formatiereZeitpunkt

test("formatiereZeitpunkt rechnet UTC in die deutsche Sommerzeit um", () => {
  assert.strictEqual(formatiereZeitpunkt("2026-10-01T18:30:00Z"), "01.10.2026, 20:30 Uhr");
});

test("formatiereZeitpunkt rechnet UTC in die deutsche Winterzeit um", () => {
  assert.strictEqual(formatiereZeitpunkt("2026-12-24T18:30:00Z"), "24.12.2026, 19:30 Uhr");
});

test("formatiereZeitpunkt wechselt bei der Umrechnung auch den Tag und schreibt Mitternacht als 00", () => {
  assert.strictEqual(formatiereZeitpunkt("2026-12-31T23:05:00Z"), "01.01.2027, 00:05 Uhr");
});

test("formatiereZeitpunkt liefert bei ungültiger Eingabe einen leeren Text", () => {
  for (const eingabe of [null, undefined, "", "gestern", 123, {}]) {
    assert.strictEqual(formatiereZeitpunkt(eingabe), "");
  }
});

//--> formatiereKommentarzeit

test("formatiereKommentarzeit zeigt bei einem unveränderten Kommentar nur den Zeitpunkt des Schreibens", () => {
  const kommentar = { createdAt: "2026-10-01T18:30:00Z", updatedAt: null };
  assert.strictEqual(formatiereKommentarzeit(kommentar), "01.10.2026, 20:30 Uhr");
});

test("formatiereKommentarzeit nennt bei einem geänderten Kommentar auch den Zeitpunkt der Änderung", () => {
  const kommentar = { createdAt: "2026-10-01T18:30:00Z", updatedAt: "2026-10-02T09:00:00Z" };
  assert.strictEqual(formatiereKommentarzeit(kommentar), "01.10.2026, 20:30 Uhr (bearbeitet am 02.10.2026, 11:00 Uhr)");
});

//--> bestimmeKommentarrechte

test("bestimmeKommentarrechte erlaubt dem Autor Bearbeiten und Löschen", () => {
  assert.deepStrictEqual(bestimmeKommentarrechte({ userId: "u_58" }, "u_58"), { aendern: true, loeschen: true });
});

test("bestimmeKommentarrechte verbietet bei einem fremden Kommentar alles", () => {
  assert.deepStrictEqual(bestimmeKommentarrechte({ userId: "u_58" }, "u_7"), { aendern: false, loeschen: false });
});

test("bestimmeKommentarrechte verbietet alles, wenn die eigene ID unbekannt ist", () => {
  for (const userId of [null, undefined, ""]) {
    assert.deepStrictEqual(bestimmeKommentarrechte({ userId: "u_58" }, userId), { aendern: false, loeschen: false });
  }
});

test("bestimmeKommentarrechte erkennt einen Kommentar ohne Autor-ID nicht als eigenen", () => {
  assert.deepStrictEqual(bestimmeKommentarrechte({}, "u_58"), { aendern: false, loeschen: false });
});

//--> bestimmeZielseite

test("bestimmeZielseite bleibt bei der Seite, solange sie Kommentare hat", () => {
  assert.strictEqual(bestimmeZielseite(1, 5), 1);
  assert.strictEqual(bestimmeZielseite(3, 1), 3);
});

test("bestimmeZielseite geht eine Seite zurück, wenn eine spätere Seite leer ist", () => {
  assert.strictEqual(bestimmeZielseite(2, 0), 1);
  assert.strictEqual(bestimmeZielseite(4, 0), 3);
});

test("bestimmeZielseite bleibt auf Seite 1, auch wenn sie leer ist", () => {
  assert.strictEqual(bestimmeZielseite(1, 0), 1);
});

//--> uebersetzeKommentarfehler

test("uebersetzeKommentarfehler erklärt bei 400, wie lang ein Kommentar sein muss", () => {
  assert.strictEqual(uebersetzeKommentarfehler(400, "speichern"), "Ein Kommentar muss zwischen 1 und 500 Zeichen lang sein.");
  assert.strictEqual(uebersetzeKommentarfehler(400, "aendern"), "Ein Kommentar muss zwischen 1 und 500 Zeichen lang sein.");
});

test("uebersetzeKommentarfehler unterscheidet bei 403 zwischen Ändern und Löschen", () => {
  assert.strictEqual(uebersetzeKommentarfehler(403, "aendern"), "Du kannst nur deine eigenen Kommentare ändern.");
  assert.strictEqual(uebersetzeKommentarfehler(403, "loeschen"), "Du kannst nur deine eigenen Kommentare löschen.");
});

test("uebersetzeKommentarfehler unterscheidet bei 404 zwischen Film und Kommentar", () => {
  assert.strictEqual(uebersetzeKommentarfehler(404, "laden"), "Diesen Film gibt es nicht.");
  assert.strictEqual(uebersetzeKommentarfehler(404, "speichern"), "Diesen Film gibt es nicht.");
  assert.strictEqual(uebersetzeKommentarfehler(404, "aendern"), "Diesen Kommentar gibt es nicht mehr.");
  assert.strictEqual(uebersetzeKommentarfehler(404, "loeschen"), "Diesen Kommentar gibt es nicht mehr.");
});

test("uebersetzeKommentarfehler sagt bei 0, 502 und 503, dass der Server nicht erreichbar ist", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  for (const status of [0, 502, 503]) assert.strictEqual(uebersetzeKommentarfehler(status, "laden"), erwartet);
});

test("uebersetzeKommentarfehler nennt bei anderen Fehlern die Aktion, die nicht geklappt hat", () => {
  assert.match(uebersetzeKommentarfehler(500, "laden"), /Die Kommentare konnten nicht geladen werden/);
  assert.match(uebersetzeKommentarfehler(500, "speichern"), /Dein Kommentar konnte nicht gesendet werden/);
  assert.match(uebersetzeKommentarfehler(500, "aendern"), /Dein Kommentar konnte nicht geändert werden/);
  assert.match(uebersetzeKommentarfehler(500, "loeschen"), /Der Kommentar konnte nicht gelöscht werden/);
});

test("uebersetzeKommentarfehler nimmt ohne bekannte Aktion den Text zum Senden", () => {
  assert.match(uebersetzeKommentarfehler(500), /Dein Kommentar konnte nicht gesendet werden/);
  assert.match(uebersetzeKommentarfehler(500, "unbekannt"), /Dein Kommentar konnte nicht gesendet werden/);
});