// Einstiegspunkt der SPA. Wird von index.html als Modul geladen.
//--> Verknüpfung von Navigation (Router) und echtem Datencheck, also ob der Server bzw. BFF erreichbar ist
import { holeStatus } from "./api.js";
import { starteRouter } from "./router.js";

// Zeigt die passende Ansicht und reagiert auf Adressänderungen.
starteRouter();

// Statusanzeige im Footer: Ist das BFF erreichbar?
const statusElement = document.getElementById("status");

holeStatus()
  .then((daten) => {
    // Erfolg: Nachricht des BFF anzeigen, z. B. "CineRate-BFF läuft"
    statusElement.textContent = daten.nachricht;
  })
  .catch(() => {
    // Fehler (z. B. BFF läuft nicht): Hinweis anzeigen
    statusElement.textContent = "BFF nicht erreichbar";
  });