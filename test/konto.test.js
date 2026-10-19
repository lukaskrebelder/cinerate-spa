//--> Tests mithilfe von CLAUDE Sonnet 5.5 (zeitliche Gründe)
// Unit-Tests für die Fehlertexte der Kontoseite aus js/views/konto.js (PB-04).
import test from "node:test";
import assert from "node:assert";
import { uebersetzeLoeschfehler } from "../js/views/konto.js";

test("uebersetzeLoeschfehler meldet bei 403, dass dieses Konto nicht gelöscht werden darf", () => {
  assert.strictEqual(uebersetzeLoeschfehler(403), "Dieses Konto kannst du nicht löschen.");
});

test("uebersetzeLoeschfehler meldet bei 0, 502 und 503 einen nicht erreichbaren Server", () => {
  const erwartet = "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  assert.strictEqual(uebersetzeLoeschfehler(0), erwartet);
  assert.strictEqual(uebersetzeLoeschfehler(502), erwartet);
  assert.strictEqual(uebersetzeLoeschfehler(503), erwartet);
});

test("uebersetzeLoeschfehler hat für andere Status einen allgemeinen Text", () => {
  assert.strictEqual(
    uebersetzeLoeschfehler(500),
    "Das Konto konnte nicht gelöscht werden. Bitte versuche es später noch einmal."
  );
});