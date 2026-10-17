// Zugriffsschutz der SPA (PB-12).
// Manche Seiten sind nur für angemeldete Nutzer (--> diese sind geschützt)
// Andere Seiten sind nur für Gäste (--> nurGäste),
// zum Beispiel Anmelden und Registrieren. Wer eine Seite nicht sehen darf, wird umgeleitet.

// Hinweise, die auf der Anmeldeseite erscheinen
export const HINWEIS_ANMELDUNG_NOETIG = "Bitte melde dich an, um diese Seite zu sehen.";
export const HINWEIS_SITZUNG_ABGELAUFEN = "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.";

// Prüft, ob der Nutzer die Seite sehen darf.
// und gibt null zurück, wenn ja, sonst die Adresse, zu der umgeleitet werden soll.
// Die Funktion ist rein (kein Zugriff auf Browser oder Speicher) und lässt sich deshalb gut testen.
export function pruefeZugriff(route, angemeldet) {
  if (route?.geschuetzt && !angemeldet) return "/anmelden";
  if (route?.nurGaeste && angemeldet) return "/";
  return null;
}

//--> Mithilfe von CLAUDE Sonnett 5.5
// Ein Hinweis für die nächste Ansicht. Er steht nur im Arbeitsspeicher, weil die Seite beim
// Wechseln zwischen den Ansichten nicht neu geladen wird.
let hinweis = null;

export function setzeHinweis(text) {
  hinweis = text;
}

// Liefert den Hinweis einmalig. Danach ist er weg und erscheint nicht ein zweites Mal.
export function holeHinweis() {
  const text = hinweis;
  hinweis = null;
  return text;
}