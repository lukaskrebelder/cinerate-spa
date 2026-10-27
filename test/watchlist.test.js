// KI-Log B29: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Hilfsfunktionen der Watchlist aus js/views/watchlist.js (PB-21 und PB-22).
import test from "node:test";
import assert from "node:assert";
import {
  istAufWatchlist,
  bestimmeKnopfText,
  bestimmeWatchlistBestaetigung,
  bestimmeWatchlistStatus,
  uebersetzeWatchlistfehler,
} from "../js/views/watchlist.js";

const filme = [
  { movieId: 157336, title: "Interstellar", posterUrl: null },
  { movieId: 603, title: "Matrix", posterUrl: null },
];

//--> istAufWatchlist

test("istAufWatchlist findet einen Film in der Liste", () => {
  assert.strictEqual(istAufWatchlist(filme, 157336), true);
  assert.strictEqual(istAufWatchlist(filme, 603), true);
});

test("istAufWatchlist erkennt, dass ein Film nicht in der Liste steht", () => {
  assert.strictEqual(istAufWatchlist(filme, 1), false);
  assert.strictEqual(istAufWatchlist([], 157336), false);
});

test("istAufWatchlist vergleicht die ID auch dann richtig, wenn sie als Text kommt", () => {
  assert.strictEqual(istAufWatchlist(filme, "157336"), true);
});

test("istAufWatchlist kommt mit fehlender Liste zurecht", () => {
  assert.strictEqual(istAufWatchlist(undefined, 157336), false);
  assert.strictEqual(istAufWatchlist(null, 157336), false);
});

//--> bestimmeKnopfText

test("bestimmeKnopfText beschriftet den Knopf mit dem Gegenteil des Zustands", () => {
  assert.strictEqual(bestimmeKnopfText(false), "Zur Watchlist hinzufügen");
  assert.strictEqual(bestimmeKnopfText(true), "Von der Watchlist entfernen");
});

//--> bestimmeWatchlistBestaetigung

test("bestimmeWatchlistBestaetigung meldet Hinzufügen und Entfernen", () => {
  assert.strictEqual(bestimmeWatchlistBestaetigung(true), "Der Film wurde zur Watchlist hinzugefügt.");
  assert.strictEqual(bestimmeWatchlistBestaetigung(false), "Der Film wurde von der Watchlist entfernt.");
});

//--> bestimmeWatchlistStatus

test("bestimmeWatchlistStatus zeigt bei einer leeren Watchlist einen Hinweis", () => {
  assert.strictEqual(
    bestimmeWatchlistStatus(0),
    "Deine Watchlist ist leer. Öffne einen Film und wähle „Zur Watchlist hinzufügen“."
  );
});

test("bestimmeWatchlistStatus zeigt bei Filmen auf der Watchlist keinen Hinweis", () => {
  assert.strictEqual(bestimmeWatchlistStatus(1), "");
  assert.strictEqual(bestimmeWatchlistStatus(12), "");
});

//--> uebersetzeWatchlistfehler

test("uebersetzeWatchlistfehler meldet bei 409, dass der Film schon auf der Watchlist steht", () => {
  assert.strictEqual(uebersetzeWatchlistfehler(409, "hinzufuegen"), "Dieser Film steht schon auf deiner Watchlist.");
});

test("uebersetzeWatchlistfehler unterscheidet bei 404 zwischen Entfernen und den anderen Aktionen", () => {
  assert.strictEqual(uebersetzeWatchlistfehler(404, "entfernen"), "Dieser Film steht nicht auf deiner Watchlist.");
  assert.strictEqual(uebersetzeWatchlistfehler(404, "hinzufuegen"), "Diesen Film gibt es nicht.");
});

test("uebersetzeWatchlistfehler meldet bei 0, 502 und 503 einen nicht erreichbaren Server", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  assert.strictEqual(uebersetzeWatchlistfehler(0, "laden"), erwartet);
  assert.strictEqual(uebersetzeWatchlistfehler(502, "entfernen"), erwartet);
  assert.strictEqual(uebersetzeWatchlistfehler(503, "hinzufuegen"), erwartet);
});

test("uebersetzeWatchlistfehler hat für andere Status je nach Aktion einen allgemeinen Text", () => {
  assert.strictEqual(
    uebersetzeWatchlistfehler(500, "hinzufuegen"),
    "Der Film konnte nicht zur Watchlist hinzugefügt werden. Bitte versuche es später noch einmal."
  );
  assert.strictEqual(
    uebersetzeWatchlistfehler(500, "entfernen"),
    "Der Film konnte nicht von der Watchlist entfernt werden. Bitte versuche es später noch einmal."
  );
  assert.strictEqual(
    uebersetzeWatchlistfehler(500, "laden"),
    "Die Watchlist konnte nicht geladen werden. Bitte versuche es später noch einmal."
  );
  assert.strictEqual(
    uebersetzeWatchlistfehler(500),
    "Die Watchlist konnte nicht geladen werden. Bitte versuche es später noch einmal."
  );
});