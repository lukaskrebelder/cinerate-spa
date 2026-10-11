// Unit-Tests für die Menüpunkte aus js/navigation.js (US-2).
import test from "node:test";
import assert from "node:assert";
import { bestimmeMenuepunkte } from "../js/navigation.js";

// Nutzer ohne Anmeldung

test("bestimmeMenuepunkte zeigt ohne Anmeldung Start, Anmelden und Registrieren", () => {
  const texte = bestimmeMenuepunkte(false).map((punkt) => punkt.text);
  assert.deepStrictEqual(texte, ["Start", "Anmelden", "Registrieren"]);
});

test("bestimmeMenuepunkte führt Anmelden und Registrieren auf ihre Seiten", () => {
  const punkte = bestimmeMenuepunkte(false);
  assert.strictEqual(punkte.find((p) => p.text === "Anmelden").route, "/anmelden");
  assert.strictEqual(punkte.find((p) => p.text === "Registrieren").route, "/registrieren");
});

test("bestimmeMenuepunkte zeigt ohne Anmeldung kein Abmelden", () => {
  const texte = bestimmeMenuepunkte(false).map((punkt) => punkt.text);
  assert.strictEqual(texte.includes("Abmelden"), false);
});

// Angemeldeter Nutzer 

test("bestimmeMenuepunkte zeigt mit Anmeldung Start und Abmelden", () => {
  const texte = bestimmeMenuepunkte(true).map((punkt) => punkt.text);
  assert.deepStrictEqual(texte, ["Start", "Abmelden"]);
});

test("bestimmeMenuepunkte zeigt mit Anmeldung weder Anmelden noch Registrieren", () => {
  const texte = bestimmeMenuepunkte(true).map((punkt) => punkt.text);
  assert.strictEqual(texte.includes("Anmelden"), false);
  assert.strictEqual(texte.includes("Registrieren"), false);
});
//--> Angemeldete Nutzer sehen weder den Link zum Anmelden, noch zum Registrieren

test("bestimmeMenuepunkte gibt Abmelden eine Aktion statt einer Adresse", () => {
  const abmelden = bestimmeMenuepunkte(true).find((p) => p.text === "Abmelden");
  assert.strictEqual(abmelden.aktion, "abmelden");
  assert.strictEqual(abmelden.route, undefined);
});
//--> Keine normale Verlinkung/Weiterleitung per URL, sondern das Auslösen einer Aktion

// Start
test("bestimmeMenuepunkte enthält Start in beiden Zuständen an erster Stelle", () => {
  assert.strictEqual(bestimmeMenuepunkte(false)[0].route, "/");
  assert.strictEqual(bestimmeMenuepunkte(true)[0].route, "/");
});
//--> Der erste Eintrag im Navigationsmenü muss immer die Startseite sein