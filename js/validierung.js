// Prüfregeln für Registrierung und Anmeldung (US-2) im Browser.
// sind reine Funktionen ohne Zugriff auf die Seite, damit sie sich einfach testen lassen.
// Die Regeln entsprechen absichtlich 1:1 denen im Backend (lib/validation.js). 
// ! Die Prüfungen im Backend bleiben weiterhin die signifikanten, im Prüfungen im SPA dienen 
// nur der schnellen Rückmeldung im Formular !

// Text ohne Leerzeichen am Anfang und Ende, in Kleinbuchstaben
export function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

// Kein Leerzeichen, genau ein @, danach Text, ein Punkt und wieder Text
//--> Test auf grobe Gültigkeit der Email-Adresse
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_PATTERN.test(email);
}

// Prüfung, ob PW mind. 8 Zeichen lang ist. Leerzeichen zählen mit (das Passwort wird nicht getrimmt)
export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8;
}

// Test, ob Text nicht komplett leer oder nur aus unsichtbaren Leerzeichen besteht
export function isNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidRegistration(data) {
  if (typeof data !== "object" || data === null) return false;  // Prüfung ob es sich um ein echtes Js-Objekt handelt
  //--> Falls js-Objekt, werden alle Felder mit dem Funktionen von oben geprüft
  return (
    isNonEmptyText(data.firstName) &&
    isNonEmptyText(data.lastName) &&
    isValidEmail(normalizeEmail(data.email)) &&
    isValidPassword(data.password)
  );
}

// Sammelt alle Fehler eines Registrierungsformular in Form von verständlichen Texten
// Ist die Liste leer, so bedeutet das, dass die Eingabe in Ordnung ist
// !! Dennoch wird die Eingabe vom Backend nochmal geprüft !!
export function findeRegistrierungsfehler(daten) {
  const fehler = [];
  if (!isNonEmptyText(daten?.firstName)) fehler.push("Bitte gib deinen Vornamen ein.");
  if (!isNonEmptyText(daten?.lastName)) fehler.push("Bitte gib deinen Nachnamen ein.");
  if (!isValidEmail(normalizeEmail(daten?.email))) fehler.push("Bitte gib eine gültige E-Mail-Adresse ein.");
  if (!isValidPassword(daten?.password)) fehler.push("Das Passwort muss mindestens 8 Zeichen lang sein.");
  return fehler;
}


// Sammelt die Fehler eines Anmeldeformulars als verständliche Texte.
// Es wird nur geprüft, ob beide Felder ausgefüllt sind. Ob E-Mail und Passwort stimmen,
// entscheidet das Backend (mit derselben Meldung für beide Fälle).
export function findeAnmeldefehler(daten) {
  const fehler = [];
  if (!isNonEmptyText(daten?.email)) fehler.push("Bitte gib deine E-Mail-Adresse ein.");
  if (!isNonEmptyText(daten?.password)) fehler.push("Bitte gib dein Passwort ein.");
  return fehler;
}
