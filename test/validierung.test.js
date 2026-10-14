// Alle Unit-Tests für die entsprechenden Prüfregeln aus js/validierung.js (US-2).

import test from "node:test";
import assert from "node:assert";
import {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  isNonEmptyText,
  isValidRegistration,
  findeRegistrierungsfehler,
  findeAnmeldefehler,
} from "../js/validierung.js";

//--> normalizeEmail

test("normalizeEmail entfernt Leerzeichen und macht alles klein", () => {
  assert.strictEqual(normalizeEmail("  Max@Example.COM  "), "max@example.com");
});

test("normalizeEmail gibt bei Nicht-Text einen leeren Text zurück", () => {
  assert.strictEqual(normalizeEmail(undefined), "");
  assert.strictEqual(normalizeEmail(123), "");
});

//--> isValidEmail 

test("isValidEmail akzeptiert eine normale E-Mail-Adresse", () => {
  assert.strictEqual(isValidEmail("max@example.com"), true);
});

test("isValidEmail lehnt Adressen ohne @ ab", () => {
  assert.strictEqual(isValidEmail("max.example.com"), false);
});

test("isValidEmail lehnt Adressen ohne Punkt nach dem @ ab", () => {
  assert.strictEqual(isValidEmail("max@example"), false);
});

test("isValidEmail lehnt Adressen mit Leerzeichen ab", () => {
  assert.strictEqual(isValidEmail("max @example.com"), false);
});

test("isValidEmail lehnt leeren Text und Nicht-Text ab", () => {
  assert.strictEqual(isValidEmail(""), false);
  assert.strictEqual(isValidEmail(null), false);
});

//--> isValidPassword (mindestens 8 Zeichen) 

test("isValidPassword lehnt 7 Zeichen ab (Grenzwert)", () => {
  assert.strictEqual(isValidPassword("1234567"), false);
});

test("isValidPassword akzeptiert genau 8 Zeichen (Grenzwert)", () => {
  assert.strictEqual(isValidPassword("12345678"), true);
});

test("isValidPassword lehnt Nicht-Text ab", () => {
  assert.strictEqual(isValidPassword(undefined), false);
  assert.strictEqual(isValidPassword(12345678), false);
});

//--> isNonEmptyText

test("isNonEmptyText akzeptiert normalen Text", () => {
  assert.strictEqual(isNonEmptyText("Max"), true);
});

test("isNonEmptyText lehnt leeren Text und nur Leerzeichen ab", () => {
  assert.strictEqual(isNonEmptyText(""), false);
  assert.strictEqual(isNonEmptyText("   "), false);
});

//--> isValidRegistration 

const gueltig = {
  firstName: "Max",
  lastName: "Mustermann",
  email: "max@example.com",
  password: "geheim123",
};

test("isValidRegistration akzeptiert vollständige, gültige Daten", () => {
  assert.strictEqual(isValidRegistration(gueltig), true);
});

test("isValidRegistration akzeptiert E-Mail mit Leerzeichen und Großbuchstaben", () => {
  assert.strictEqual(
    isValidRegistration({ ...gueltig, email: "  Max@Example.com " }),
    true
  );
});

test("isValidRegistration lehnt fehlenden Vornamen ab", () => {
  assert.strictEqual(isValidRegistration({ ...gueltig, firstName: "" }), false);
});

test("isValidRegistration lehnt fehlenden Nachnamen ab", () => {
  assert.strictEqual(isValidRegistration({ ...gueltig, lastName: "  " }), false);
});

test("isValidRegistration lehnt ungültige E-Mail ab", () => {
  assert.strictEqual(isValidRegistration({ ...gueltig, email: "kein-email" }), false);
});

test("isValidRegistration lehnt zu kurzes Passwort ab", () => {
  assert.strictEqual(isValidRegistration({ ...gueltig, password: "1234567" }), false);
});

test("isValidRegistration lehnt fehlende Daten ab", () => {
  assert.strictEqual(isValidRegistration(null), false);
  assert.strictEqual(isValidRegistration(undefined), false);
  assert.strictEqual(isValidRegistration({}), false);
});


//--> findeRegistrierungsfehler 

test("findeRegistrierungsfehler liefert bei gültigen Daten eine leere Liste", () => {
  assert.deepStrictEqual(findeRegistrierungsfehler(gueltig), []);
});

// firstname wird mit "" überschrieben, sodass es für den Test keinen Vornamen gibt
test("findeRegistrierungsfehler meldet fehlenden Vornamen", () => {
  const fehler = findeRegistrierungsfehler({ ...gueltig, firstName: "" });  // "..." = Spreadoperator
  assert.deepStrictEqual(fehler, ["Bitte gib deinen Vornamen ein."]);
});

test("findeRegistrierungsfehler meldet fehlenden Nachnamen", () => {
  const fehler = findeRegistrierungsfehler({ ...gueltig, lastName: "   " });
  assert.deepStrictEqual(fehler, ["Bitte gib deinen Nachnamen ein."]);
});

test("findeRegistrierungsfehler meldet ungültige E-Mail", () => {
  const fehler = findeRegistrierungsfehler({ ...gueltig, email: "kein-email" });
  assert.deepStrictEqual(fehler, ["Bitte gib eine gültige E-Mail-Adresse ein."]);
});

test("findeRegistrierungsfehler meldet zu kurzes Passwort (7 Zeichen)", () => {
  const fehler = findeRegistrierungsfehler({ ...gueltig, password: "1234567" });
  assert.deepStrictEqual(fehler, ["Das Passwort muss mindestens 8 Zeichen lang sein."]);
});

test("findeRegistrierungsfehler sammelt mehrere Fehler", () => {
  const fehler = findeRegistrierungsfehler({ ...gueltig, firstName: "", password: "123" });
  assert.strictEqual(fehler.length, 2);
});

test("findeRegistrierungsfehler meldet bei fehlenden Daten alle vier Fehler", () => {
  assert.strictEqual(findeRegistrierungsfehler(undefined).length, 4);
  assert.strictEqual(findeRegistrierungsfehler({}).length, 4);
});

test("findeRegistrierungsfehler stimmt mit isValidRegistration überein", () => {
  assert.strictEqual(findeRegistrierungsfehler(gueltig).length === 0, isValidRegistration(gueltig));
  const ungueltig = { ...gueltig, email: "x" };
  assert.strictEqual(findeRegistrierungsfehler(ungueltig).length === 0, isValidRegistration(ungueltig));
});


//--> findeAnmeldefehler

test("findeAnmeldefehler liefert bei ausgefüllten Feldern eine leere Liste", () => {
  assert.deepStrictEqual(
    findeAnmeldefehler({ email: "max@example.com", password: "geheim123" }),
    []
  );
});

test("findeAnmeldefehler meldet fehlende E-Mail", () => {
  const fehler = findeAnmeldefehler({ email: "  ", password: "geheim123" });
  assert.deepStrictEqual(fehler, ["Bitte gib deine E-Mail-Adresse ein."]);
});

test("findeAnmeldefehler meldet fehlendes Passwort", () => {
  const fehler = findeAnmeldefehler({ email: "max@example.com", password: "" });
  assert.deepStrictEqual(fehler, ["Bitte gib dein Passwort ein."]);
});

test("findeAnmeldefehler meldet bei fehlenden Daten beide Fehler", () => {
  assert.strictEqual(findeAnmeldefehler(undefined).length, 2);
  assert.strictEqual(findeAnmeldefehler({}).length, 2);
});