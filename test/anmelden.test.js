// KI-Log B1: Erstellt mithilfe von KI (Claude Sonnett 5.5)
// Unit-Tests für die Fehlertexte der Anmeldung aus js/views/anmelden.js (US-2).
import test from "node:test";
import assert from "node:assert";
import { uebersetzeAnmeldefehler } from "../js/views/anmelden.js";

test("uebersetzeAnmeldefehler meldet bei 400 fehlende Eingaben", () => {
  assert.strictEqual(
    uebersetzeAnmeldefehler(400),
    "Bitte gib E-Mail-Adresse und Passwort ein."
  );
});

test("uebersetzeAnmeldefehler meldet bei 401 falsche Zugangsdaten, ohne zu verraten, was falsch war", () => {
  assert.strictEqual(
    uebersetzeAnmeldefehler(401),
    "E-Mail-Adresse oder Passwort ist falsch."
  );
});

test("uebersetzeAnmeldefehler meldet bei 0, 502 und 503 einen nicht erreichbaren Server", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  assert.strictEqual(uebersetzeAnmeldefehler(0), erwartet);
  assert.strictEqual(uebersetzeAnmeldefehler(502), erwartet);
  assert.strictEqual(uebersetzeAnmeldefehler(503), erwartet);
});

test("uebersetzeAnmeldefehler hat für andere Status einen allgemeinen Text", () => {
  assert.strictEqual(
    uebersetzeAnmeldefehler(500),
    "Die Anmeldung ist fehlgeschlagen. Bitte versuche es später noch einmal."
  );
});