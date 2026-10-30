// KI-Log B32: Erstellt mithilfe von KI (Claude Sonnett 5.5) – Verwaltung des Anmelde-Tokens im Browser
// Das Token bekommt die SPA nach dem Login vom Backend --> Es ist der "Ausweis" für
// alle geschützten Aufrufe und wird im localStorage des Browsers gespeichert.

const SCHLUESSEL = "cinerate_token";
const SCHLUESSEL_USER_ID = "cinerate_userId";

// Speichert das Token. Ein leeres oder ungültiges Token wird nicht gespeichert.
export function speichereToken(token, speicher = globalThis.localStorage) {
  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("Kein gültiges Token übergeben.");
  }
  if (!speicher) return;
  speicher.setItem(SCHLUESSEL, token);  //--> SCHLUESSEL ist der Name, unter dem der Tokem im Broswer abgelegt wird
}

// Liefert das gespeicherte Token oder null, wenn keines vorhanden ist.
export function holeToken(speicher = globalThis.localStorage) {
  if (!speicher) return null;
  const token = speicher.getItem(SCHLUESSEL);
  return typeof token === "string" && token !== "" ? token : null;
}

// Löscht das Token, zum Beispiel beim Abmelden.
export function loescheToken(speicher = globalThis.localStorage) {
  if (!speicher) return;
  speicher.removeItem(SCHLUESSEL);
  speicher.removeItem(SCHLUESSEL_USER_ID);
}

// Die ID des angemeldeten Nutzer. Sie kommt vom Login und wird gebraucht, um das eigene Konto zu löschen. 
// Eine fehlende oder leere ID wird nicht gespeichert
export function speichereUserId(userId, speicher = globalThis.localStorage) {
  if (typeof userId !== "string" || userId.trim() === "") return;
  if (!speicher) return;
  speicher.setItem(SCHLUESSEL_USER_ID, userId);
}

// Liefert die gespeicherte ID oder null.
export function holeUserId(speicher = globalThis.localStorage) {
  if (!speicher) return null;
  const userId = speicher.getItem(SCHLUESSEL_USER_ID);
  return typeof userId === "string" && userId !== "" ? userId : null;
}

// Angemeldet? --> Ja, wenn ein Token gespAngemeldeteichert ist.
export function istAngemeldet(speicher = globalThis.localStorage) {
  return holeToken(speicher) !== null;
}