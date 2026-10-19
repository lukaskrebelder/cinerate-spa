// Navigation im Header. 
//--> Welche Menüpunkte sichtbar sind, hängt davon ab, ob der Nutzer angemeldet ist oder nicht
//--> Gäste sehen "Anmelden" und "Registrieren", angemeldete Nutzer sehen "Filme" und "Abmelden".
import { istAngemeldet } from "./auth.js";

// Die funktion klärt,  Menüpunkte gehören zu welchem Zustand?
// Ein Punkt mit "route" führt auf eine Seite, ein Punkt mit "aktion" löst etwas aus.
// Weil die Funktion rein ist, lässt sie sich ohne Browser testen.
export function bestimmeMenuepunkte(angemeldet) {
  const start = { text: "Start", route: "/" };

  if (angemeldet) {
        return [start, { text: "Filme", route: "/filme" }, { text: "Abmelden", aktion: "abmelden" }];
  }
  return [
    start,
    { text: "Anmelden", route: "/anmelden" },
    { text: "Registrieren", route: "/registrieren" },
  ];
}

// Erzeugt aus einem Menüpunkt den passenden Link (<a>) für die Seite.
function erzeugeLink(punkt) {
  const link = document.createElement("a");
  link.textContent = punkt.text;

  if (punkt.route) {
    link.href = `#${punkt.route}`;
    link.dataset.route = punkt.route;     // wird von router.js zum Markieren benutzt
  } else {
    link.href = "#/";
    link.dataset.aktion = punkt.aktion;   // wird von app.js beim Klick ausgewertet
  }
  return link;
}

// Baut die Navigation im Header neu auf, passend zum aktuellen Anmeldestatus.
export function zeigeNavigation() {
  const navigation = document.querySelector("nav.navigation");
  const punkte = bestimmeMenuepunkte(istAngemeldet());
  navigation.replaceChildren(...punkte.map(erzeugeLink));
}