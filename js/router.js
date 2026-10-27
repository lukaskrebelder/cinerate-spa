import { zeigeStartseite} from "./views/startseite.js";
import { zeigeNavigation } from "./navigation.js";
import { zeigeRegistrierung } from "./views/registrieren.js";
import { zeigeAnmeldung } from "./views/anmelden.js";
import { istAngemeldet } from "./auth.js";
import { pruefeZugriff, setzeHinweis, HINWEIS_ANMELDUNG_NOETIG } from "./zugriff.js";
import { zeigeFilme } from "./views/filme.js";
import { zeigeKonto } from "./views/konto.js";
import { zeigeFilm } from "./views/film.js";
import { zeigeWatchlist } from "./views/watchlist.js";

// Der Router entscheidet anhand der Adresse, welche Ansicht gezeigt wird.
// Die Adresse steht hinter dem # (zB. index.html#/anmelden)
// --> Die Seite wird also beim Wechsel nicht neu geladen, sondern nur der Inhalt von
//     <main> getauscht

// Neue Ansichten werden hier eingetragen:
// const = Konstante --> Variable, dessen Wert nicht mehr geändert werden kann
// geschuetzt: true --> nur für angemeldete Nutzer, 
// nurGaeste: true --> nur für Nutzer ohne Anmeldung
const routen = {
    "/": { ansicht: zeigeStartseite },
    "/registrieren": { ansicht: zeigeRegistrierung, nurGaeste: true },
    "/anmelden": { ansicht: zeigeAnmeldung, nurGaeste: true },
    "/filme": {ansicht: zeigeFilme, geschuetzt: true},
    "/konto": { ansicht: zeigeKonto, geschuetzt: true }, 
    "/film/:movieId": { ansicht: zeigeFilm, geschuetzt: true, menuepunkt: "/filme" },
    "/watchlist" : { ansicht: zeigeWatchlist, geschuetzt: true },
};

// Liest die aktuelle Adresse bzw. Unterseite, auf der sich der Nutzer aktuell befindet
// Sorgt dafür, dass die Startseite korrekt geladen wird, wenn die Adresse unvollständig ist
// location-Object enthält Informationen über die aktuelle URL (Adresse)
function aktuellerPfad() {
    const hash = location.hash.slice(1);    //--> schneidet das # ab: "#/anmelden" --> "/anmelden"
    return hash === "" ? "/" : hash;        //--> BEDINGUNG ? Wert wenn WAHR : Wert wenn FALSCH
}

// Sucht die Route zu einem Pfad. Liefert, bei einem unbekannten Pfad ist route undefined.
export function findeRoute(pfad) {
  const teile = pfad.split("/");

  for (const [muster, route] of Object.entries(routen)) {
    const musterTeile = muster.split("/");
    if (musterTeile.length !== teile.length) continue;   //--> Die Anzahl der Teile muss gleich sein

    const parameter = {};
    const passt = musterTeile.every((musterTeil, i) => {
      if (!musterTeil.startsWith(":")) return musterTeil === teile[i];
      if (teile[i] === "") return false;                 //--> Ein Platzhalter darf nicht leer sein
      try {
        parameter[musterTeil.slice(1)] = decodeURIComponent(teile[i]);
        return true;
      } catch {
        return false;                                    //--> kaputte Kodierung wie "%E0%A4%A"
      }
    });
    if (passt) return { route, parameter };
  }
  return { route: undefined, parameter: {} };
}


// Ansicht für unbekannte Adressen.
//--> Es werden DOM-Elemente einzeln erzeugt und ihr Text mit textContent gesetzt
function zeigeNichtGefunden(container){
    const ueberschrift = document.createElement("h1");
    ueberschrift.textContent = "Seite nicht gefunden";

    const text = document.createElement("p");
    text.textContent = "Diese Seite gibt es (noch) nicht.";

    const link = document.createElement("a");
    link.href = "#/";
    link.textContent = "Zur Startseite";

    //--> ersetzt den bisherigen Inhalt des Containers vollständig
    container.replaceChildren(ueberschrift, text, link);   
}

// Sorgt dafür, dass das Navigationsmenü optisch und barrierefrei immer zur aktuell geöffneten Seite passt
function markiereAktivenLink(pfad) {
  document.querySelectorAll("nav a[data-route]").forEach((link) => {
    const aktiv = link.dataset.route === pfad;   // data-route="/anmelden" im HTML
    link.classList.toggle("aktiv", aktiv);       // Klasse setzen oder entfernen
    if (aktiv) {
      link.setAttribute("aria-current", "page"); // Hinweis für Screenreader
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Wechselt zu einer anderen Seite. Ist die Adresse schon die richtige, ändert sich nichts am #
// und es gäbe kein hashchange, deshalb wird die Ansicht dann selbst neu aufgebaut.
export function wechsleZu(pfad) {
  if (aktuellerPfad() === pfad) {
    zeigeAnsicht();
  } else {
    location.hash = `#${pfad}`;   //--> löst hashchange aus, der Router baut alles neu auf
  }
}

// ROUTER !!!
//--> Sorgt 1. für den richtigen Inhalt, 2. dass unbekannte Seiten abgefangen und 
//--> 3. dass das Menü (Hervorhebung etc.) aktualisiert wird
export function zeigeAnsicht() {
  const container = document.getElementById("app");
  const pfad = aktuellerPfad();
  const { route, parameter } = findeRoute(pfad);

  // Darf der Nutzer die Seite sehen? Wenn nicht, wird umgeleitet und der Router läuft danach neu
  const umleitung = pruefeZugriff(route, istAngemeldet());
  if (umleitung !== null) {
    if (umleitung === "/anmelden") setzeHinweis(HINWEIS_ANMELDUNG_NOETIG);
    wechsleZu(umleitung);
    return;
  }

  zeigeNavigation(); //--> Menü wird passend zum Anmeldestatus aufgebaut
  
  // ?? nimmt die rechte Seite, wenn links nichts gefunden wurde (undefined)
  const ansicht = route?.ansicht ?? zeigeNichtGefunden;   //--> In routen sind alle Pfäde, Pfad wird nun abgeglichen mit denen in Routen
  ansicht(container, parameter);                                   //--> Wenn gefunden, dann wird entsprechende Seite angezeigt
  markiereAktivenLink(route?.menuepunkt ?? pfad);
}

// Sobald sich die Adresse/URL ändert (hashChange), dann wird die Funktion zeigeAnsicht() aufgerufen
export function starteRouter() {
  window.addEventListener("hashchange", zeigeAnsicht);
  zeigeAnsicht();
}


