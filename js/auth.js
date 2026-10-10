// Verwaltung des Anmelde-Tokens im Browser.
// Das Token bekommt die SPA nach dem Login vom Backend. Es ist der "Ausweis" für
// alle geschützten Aufrufe und wird im localStorage des Browsers gespeichert.
//
// Jede Funktion nimmt optional einen Speicher entgegen. Im Browser ist das automatisch
// localStorage, in den Tests ein einfaches Ersatzobjekt (Node hat keinen localStorage).

const SCHLUESSEL = "cinerate_token";

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
}

// Ist jemand angemeldet? Ja, wenn ein Token gespeichert ist.
export function istAngemeldet(speicher = globalThis.localStorage) {
  return holeToken(speicher) !== null;
}