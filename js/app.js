// Einstiegspunkt der SPA. Wird von index.html als Modul geladen.
//--> Verknüpfung von Navigation (Router) und echtem Datencheck, also ob der Server bzw. BFF erreichbar ist
import { holeStatus } from "./api.js";
import { starteRouter } from "./router.js";
import { loescheToken } from "./auth.js";

// Zeigt die passende Ansicht und reagiert auf Adressänderungen.
starteRouter();

// Klickt der Nutzer auf "Abmelden", so wird der Token gelöscht und es wird auf die Startseite gewechselt
// Der Klick wird am Menü ausgewertet, weil die Links bei jedem Seitenwechsel neu entstehen.
//--> Event-Delegation
document.querySelector("nav.navigation").addEventListener("click", (ereignis) => {
  const link = ereignis.target.closest("a[data-aktion]");
  if (link === null || link.dataset.aktion !== "abmelden") return;

  ereignis.preventDefault();
  loescheToken();
  if (location.hash === "" || location.hash === "#/") {
    zeigeAnsicht();          //--> Adresse ändert sich nicht, also Ansicht selbst neu aufbauen
  } else {
    location.hash = "#/";    //--> löst hashchange aus, der Router baut alles neu auf
  }
});

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