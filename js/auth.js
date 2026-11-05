// KI-Log B32: Erstellt mithilfe von KI (Claude Sonnett 5.5) – Verwaltung des Anmelde-Tokens im Browser
// Das Token bekommt die SPA nach dem Login vom Backend --> Es ist der "Ausweis" für
// alle geschützten Aufrufe und wird im localStorage des Browsers gespeichert.

const SCHLUESSEL = "cinerate_token";
const SCHLUESSEL_USER_ID = "cinerate_userId";
const SCHLUESSEL_ROLLE = "cinerate_rolle";

// Die beiden Rollen, die das Backend kennt.
export const ROLLE_NUTZER = "Nutzer";
export const ROLLE_MODERATOR = "Moderator";

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
  speicher.removeItem(SCHLUESSEL_ROLLE);
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

// Die Rolle des angemeldeten Nutzers ("Nutzer" oder "Moderator"). Sie kommt vom Login.
// Die SPA nutzt sie nur, um die passenden Knöpfe zu zeigen. Ob etwas erlaubt ist, prüft das Backend bei jedem Aufruf neu.
// Fehlt die Rolle oder ist sie unbekannt, wird eine alte Rolle gelöscht, damit nie die Rolle eines früheren Logins bleibt.
export function speichereRolle(rolle, speicher = globalThis.localStorage) {
  if (!speicher) return;
  if (rolle === ROLLE_NUTZER || rolle === ROLLE_MODERATOR) {
    speicher.setItem(SCHLUESSEL_ROLLE, rolle);
  } else {
    speicher.removeItem(SCHLUESSEL_ROLLE);
  }
}

// Liefert die gespeicherte Rolle oder null (zum Beispiel bei einer älteren Anmeldung ohne Rolle).
export function holeRolle(speicher = globalThis.localStorage) {
  if (!speicher) return null;
  const rolle = speicher.getItem(SCHLUESSEL_ROLLE);
  return rolle === ROLLE_NUTZER || rolle === ROLLE_MODERATOR ? rolle : null;
}

// Angemeldet? --> Ja, wenn ein Token gespAngemeldeteichert ist.
export function istAngemeldet(speicher = globalThis.localStorage) {
  return holeToken(speicher) !== null;
}