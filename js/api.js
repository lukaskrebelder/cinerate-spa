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

//Allgemeine Anfrage an das BFF. Falls vorhanden, wird das Token im Header mitgegeben
export async function anfrage(pfad, { methode = "GET", daten } = {}) {
  const kopfzeilen = { "Content-Type": "application/json" };

  const token = holeToken();
  if (token !== null) {
    kopfzeilen.Authorization = `Bearer ${token}`;
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

  // fetch wirft bei 4xx/5xx nicht von selbst, deshalb wird hier geprüft
  if (!antwort.ok) {
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