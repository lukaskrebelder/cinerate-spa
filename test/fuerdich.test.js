// KI-Log B31: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Hilfsfunktionen der Seite Für dich aus js/views/fuerdich.js (PB-26).
import test from "node:test";
import assert from "node:assert";
import {
  kuerzeBeschreibung,
  bestimmeGenreText,
  bestimmeMeldungsart,
  uebersetzeVorschlagfehler,
} from "../js/views/fuerdich.js";

//--> kuerzeBeschreibung

test("kuerzeBeschreibung lässt kurze Texte unverändert", () => {
  assert.strictEqual(kuerzeBeschreibung("Ein kurzer Text."), "Ein kurzer Text.");
});

test("kuerzeBeschreibung entfernt überflüssige Leerzeichen und Zeilenumbrüche", () => {
  assert.strictEqual(kuerzeBeschreibung("  Zwei   Wörter\nund ein Umbruch  "), "Zwei Wörter und ein Umbruch");
});

test("kuerzeBeschreibung schneidet lange Texte an einem Leerzeichen ab und hängt Auslassungspunkte an", () => {
  const lang = "Wort ".repeat(60).trim();
  const kurz = kuerzeBeschreibung(lang, 50);
  assert.ok(kurz.endsWith(" …"));
  assert.ok(kurz.length <= 52);
  assert.ok(!kurz.slice(0, -2).trimEnd().endsWith("Wor"), "kein zerrissenes Wort");
  assert.strictEqual(kurz, "Wort Wort Wort Wort Wort Wort Wort Wort Wort Wort …");
});

test("kuerzeBeschreibung schneidet ein sehr langes Wort ohne Leerzeichen hart ab", () => {
  const kurz = kuerzeBeschreibung("a".repeat(300), 40);
  assert.strictEqual(kurz, "a".repeat(40) + " …");
});

test("kuerzeBeschreibung meldet fehlende Beschreibungen", () => {
  assert.strictEqual(kuerzeBeschreibung(null), "Keine Beschreibung vorhanden.");
  assert.strictEqual(kuerzeBeschreibung(undefined), "Keine Beschreibung vorhanden.");
  assert.strictEqual(kuerzeBeschreibung("   "), "Keine Beschreibung vorhanden.");
});

//--> bestimmeGenreText

test("bestimmeGenreText nennt das Lieblingsgenre", () => {
  assert.strictEqual(bestimmeGenreText("Science Fiction"), "Passend zu deinem Lieblingsgenre: Science Fiction");
});

test("bestimmeGenreText hat ohne Genre einen allgemeinen Text", () => {
  assert.strictEqual(bestimmeGenreText(null), "Vorschläge, die zu deinen Bewertungen passen");
  assert.strictEqual(bestimmeGenreText(""), "Vorschläge, die zu deinen Bewertungen passen");
});

//--> bestimmeMeldungsart

test("bestimmeMeldungsart zeigt 400 und 404 als Hinweis", () => {
  assert.strictEqual(bestimmeMeldungsart(400), "hinweis");
  assert.strictEqual(bestimmeMeldungsart(404), "hinweis");
});

test("bestimmeMeldungsart zeigt alle anderen Status als Fehler", () => {
  assert.strictEqual(bestimmeMeldungsart(0), "fehler");
  assert.strictEqual(bestimmeMeldungsart(500), "fehler");
  assert.strictEqual(bestimmeMeldungsart(503), "fehler");
});

//--> uebersetzeVorschlagfehler

test("uebersetzeVorschlagfehler unterscheidet bei 400, was dem Nutzer fehlt", () => {
  assert.strictEqual(
    uebersetzeVorschlagfehler(400, "Please rate at least 3 movies first."),
    "Bewerte zuerst mindestens 3 Filme, dann können wir dir Vorschläge machen."
  );
  assert.strictEqual(
    uebersetzeVorschlagfehler(400, "Please rate at least one movie with 4 or 5 stars."),
    "Bewerte mindestens einen Film mit 4 oder 5 Sternen, damit wir dein Lieblingsgenre erkennen."
  );
});

test("uebersetzeVorschlagfehler hat bei einer unbekannten 400er-Meldung einen allgemeinen Text", () => {
  assert.strictEqual(uebersetzeVorschlagfehler(400, "etwas anderes"), "Für Vorschläge brauchen wir mehr Bewertungen von dir.");
  assert.strictEqual(uebersetzeVorschlagfehler(400), "Für Vorschläge brauchen wir mehr Bewertungen von dir.");
});

test("uebersetzeVorschlagfehler meldet bei 404, dass es nichts Neues gibt", () => {
  assert.strictEqual(uebersetzeVorschlagfehler(404, "No new recommendations available."), "Im Moment gibt es keine neuen Vorschläge für dich.");
});

test("uebersetzeVorschlagfehler meldet bei 0, 502 und 503 einen nicht erreichbaren Server", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  assert.strictEqual(uebersetzeVorschlagfehler(0), erwartet);
  assert.strictEqual(uebersetzeVorschlagfehler(502), erwartet);
  assert.strictEqual(uebersetzeVorschlagfehler(503), erwartet);
});

test("uebersetzeVorschlagfehler hat für andere Status einen allgemeinen Text", () => {
  assert.strictEqual(
    uebersetzeVorschlagfehler(500),
    "Die Vorschläge konnten nicht geladen werden. Bitte versuche es später noch einmal."
  );
});