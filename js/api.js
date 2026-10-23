// Alle Aufrufe an das BFF laufen über api.js
// Das SPA spricht nur mit dem BFF, nie direkt mit dem Backend oder der TMDB

import { holeToken } from "./auth.js";

// Basis-URL des BFF. Lokal: localhost:4000, sonst die Heroku-Adresse.
//--> typeof location prüft, ob es einen Browser gibt
const istLokal = typeof location !== "undefined" && 
      (location.hostname === "localhost" || location.hostname === "127.0.0.1");
      
export const BFF_BASE_URL = istLokal
    ? "http://localhost:4000"
    : "https://cinerate-bff-be82e8357e5c.herokuapp.com";

// Alle Routen des BFF beginnen mit dem Präfix /bff
const PRAEFIX = "/bff";

// Fehler, den die Funktion anfrage() wirft, wenn der Server einen Fehlerstatus liefert oder nicht erreichbar ist
export class ApiFehler extends Error {
  constructor(status, nachricht) {
    super(nachricht);
    this.status = status;
  }
}

// Läuft die Sitzung ab (das BFF antwortet auf einen geschützten Aufruf mit 401), wird dieser
// Handler aufgerufen. app.js trägt ihn ein: Er meldet ab und wechselt zur Anmeldung.
// So muss nicht jede Ansicht selbst darauf reagieren.
let sitzungsHandler = () => {};

export function setzeSitzungsHandler(handler) {
  sitzungsHandler = handler;
}

//Allgemeine Anfrage an das BFF -->cFalls vorhanden, wird das Token im Header mitgegeben
// geschützt: true bei Aufrufen, die ein Token brauchen. Ist keines da oder lehnt das BFF es mit 401 ab,
// wird der Sitzungshandler aufgerufen. Wer solche Aufrufe macht, braucht bei einem Fehler mit
// Status 401 nichts mehr anzuzeigen, die Anmeldeseite erscheint dann schon.
// Bei normalen Aufrufen, zB. Login bedeutet 401 nur "Zugangsdaten falsch", das ist kein Sitzungsende.
export async function anfrage(pfad, { methode = "GET", daten, geschuetzt = false } = {}) {
  const kopfzeilen = { "Content-Type": "application/json" };

  const token = holeToken();
  if (token !== null) {
    kopfzeilen.Authorization = `Bearer ${token}`;
  }

  if (geschuetzt && token === null) {
    sitzungsHandler();
    throw new ApiFehler(401, "Nicht angemeldet.");
  }

  let antwort;
  try {
    antwort = await fetch(`${BFF_BASE_URL}${PRAEFIX}${pfad}`, {
      method: methode,
      headers: kopfzeilen,
      body: daten === undefined ? undefined : JSON.stringify(daten),
    });
  } catch {
    // fetch wirft nur bei Netzwerkproblemen, nicht bei Fehlerstatus wie 404
    throw new ApiFehler(0, "BFF nicht erreichbar");
  }

  // Die Antwort darf ohne gültiges JSON kommen (z. B. bei einem Serverabsturz)
  const inhalt = await antwort.json().catch(() => ({}));

  if (!antwort.ok) {
    if (geschuetzt && antwort.status === 401) sitzungsHandler();
    throw new ApiFehler(antwort.status, inhalt.message ?? "");
  }
  return inhalt;
}

// Statusabfrage für die Anzeige im Footer
export function holeStatus() {
  return anfrage("/status");
}

// Registrierung (US-2): POST /bff/users
// --> Erwartet: firstName, lastName, email, password
export function registriereNutzer(daten){
  return anfrage("/users", { methode: "POST", daten });  
}
//--> "/users" = Zieladresse am Server
//--> POST = HTTP-POST, signalisiert, dass neue Daten auf den Server hinzugefügt und dauerhaft gespeichert werden sollen
//--> daten = die eigentlichen Informationen, die an den Server geschickt und unter /users gespeichert werden



// Anmeldung (US-2): POST /bff/auth. Erwartet email und password, liefert { token }.
export function meldeAn(daten) {
  return anfrage("/auth", { methode: "POST", daten });
}

// Abmeldung (US-2): DELETE /bff/auth. Das Token geht automatisch im Header mit,
// das Backend beendet damit die Sitzung.
export function meldeAb() {
  return anfrage("/auth", { methode: "DELETE" });
}

// Mithilfe von CLAUDE Sonnet 5.5
// Baut den Pfad für die Filmsuche.
// --> Nur ausgefüllte Felder kommen in die Adresse.
// --> URLSearchParams kümmert sich um Leerzeichen und Sonderzeichen (zB. "Science Fiction").
export function baueSuchpfad({ query, genre, page } = {}) {
  const parameter = new URLSearchParams();
  if (typeof query === "string" && query.trim() !== "") parameter.set("query", query.trim());
  if (typeof genre === "string" && genre.trim() !== "") parameter.set("genre", genre.trim());
  if (Number.isInteger(page) && page > 1) parameter.set("page", String(page));

  const text = parameter.toString();
  return text === "" ? "/movies" : `/movies?${text}`;
}

// Filmsuche: GET /bff/movies. Ohne Titel und Genre liefert das Backend eine Standardliste.
// Antwort: { page, totalPages, movies: [{ movieId, title, posterUrl }] }
// geschuetzt: Ohne gültige Sitzung wird zur Anmeldung gewechselt (siehe setzeSitzungsHandler).
export function sucheFilme(suche) {
  return anfrage(baueSuchpfad(suche), { geschuetzt: true });
}

// Konto löschen (PB-04): DELETE /bff/users/{userId}. Das Backend löscht das Konto mit allen Daten
// und erlaubt es nur für das eigene Konto (sonst 403). Die ID hat das Format "u_67".
export function loescheKonto(userId) {
  return anfrage(`/users/${encodeURIComponent(userId)}`, { methode: "DELETE", geschuetzt: true });
}

// Filmdetails: Die ID ist die TMDB-ID aus der Trefferliste
// description, fsk, releaseYear, runtime, posterUrl und avgRating können null sein
// --> Ohne gültige Sitzung wird zur Anmeldung gewechselt
export function holeFilm(movieId) {
  return anfrage(`/movies/${encodeURIComponent(movieId)}`, { geschuetzt: true });
}
