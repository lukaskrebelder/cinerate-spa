// Unit-Tests für die Fehlertexte der Registrierung aus js/views/registrieren.js (US-2).
import test from "node:test";
import assert from "node:assert";
import { uebersetzeFehler } from "../js/views/registrieren.js";

test("uebersetzeFehler meldet bei 400 ungültige Eingaben", () => {
  assert.strictEqual(uebersetzeFehler(400), "Bitte prüfe deine Eingaben.");
});

test("uebersetzeFehler meldet bei 409, dass es die E-Mail schon gibt", () => {
  assert.strictEqual(
    uebersetzeFehler(409),
    "Mit dieser E-Mail-Adresse gibt es bereits ein Konto."
  );
});

test("uebersetzeFehler meldet bei 0, 502 und 503 einen nicht erreichbaren Server", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  assert.strictEqual(uebersetzeFehler(0), erwartet);
  assert.strictEqual(uebersetzeFehler(502), erwartet);
  assert.strictEqual(uebersetzeFehler(503), erwartet);
});

test("uebersetzeFehler hat für andere Status einen allgemeinen Text", () => {
  assert.strictEqual(
    uebersetzeFehler(500),
    "Die Registrierung ist fehlgeschlagen. Bitte versuche es später noch einmal."
  );
});