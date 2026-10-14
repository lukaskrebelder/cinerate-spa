import { zeigeStartseite} from "./views/startseite.js";
import { zeigeNavigation } from "./navigation.js";
import { zeigeRegistrierung } from "./views/registrieren.js";
import { zeigeAnmeldung } from "./views/anmelden.js";

// Der Router entscheidet anhand der Adresse, welche Ansicht gezeigt wird.
// Die Adresse steht hinter dem # (zB. index.html#/anmelden)
// --> Die Seite wird also beim Wechsel nicht neu geladen, sondern nur der Inhalt von
//     <main> getauscht

// Neue Ansichten werden hier eingetragen:
// const = Konstante --> Variable, dessen Wert nicht mehr geändert werden kann
const routen = {
    "/": zeigeStartseite,
    "/registrieren": zeigeRegistrierung,
    "/anmelden": zeigeAnmeldung,
};

// Liest die aktuelle Adresse bzw. Unterseite, auf der sich der Nutzer aktuell befindet
// Sorgt dafür, dass die Startseite korrekt geladen wird, wenn die Adresse unvollständig ist
// location-Object enthält Informationen über die aktuelle URL (Adresse)
function aktuellerPfad() {
    const hash = location.hash.slice(1);    //--> schneidet das # ab: "#/anmelden" --> "/anmelden"
    return hash === "" ? "/" : hash;        //--> BEDINGUNG ? Wert wenn WAHR : Wert wenn FALSCH
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

// ROUTER !!!
//--> Sorgt 1. für den richtigen Inhalt, 2. dass unbekannte Seiten abgefangen und 
//--> 3. dass das Menü (Hervorhebung etc.) aktualisiert wird
export function zeigeAnsicht() {
  const container = document.getElementById("app");
  const pfad = aktuellerPfad();

  zeigeNavigation(); //--> Menü wird passend zum Anmeldestatus aufgebaut
  
  // ?? nimmt die rechte Seite, wenn links nichts gefunden wurde (undefined)
  const ansicht = routen[pfad] ?? zeigeNichtGefunden;   //--> In routen sind alle Pfäde, Pfad wird nun abgeglichen mit denen in Routen
  ansicht(container);                                   //--> Wenn gefunden, dann wird entsprechende Seite angezeigt
  markiereAktivenLink(pfad);
}

// Sobald sich die Adresse/URL ändert (hashChange), dann wird die Funktion zeigeAnsicht() aufgerufen
export function starteRouter() {
  window.addEventListener("hashchange", zeigeAnsicht);
  zeigeAnsicht();
}


