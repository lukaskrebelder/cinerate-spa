// Ansicht

import { istAngemeldet } from "../auth.js";

// --> Funktion, die ihren Inhalt in den übergebenen Container schreibt
// --> Der Router in router.js ruft sie dann auf, wenn die Adresse passt

// innerHTML ist hier unkritisch, da der Text fest im Code steht. Sobald jedoch Texte von Nutzern 
// oder vom BFF kommen (bspw. Filmtitel/Kommentare), muss stattdessen "textContent" genutzt werden
// --> wichtig, um Schadcode zu verhindern!

//--> Funktion ist der Platz für die Startseite
//--> Der Knopf zur Registrierung ist nur für Gäste sinnvoll
export function zeigeStartseite(container){
  const registrieren = istAngemeldet() ? "" : `<a class="button" href="#/registrieren">Jetzt registrieren</a>`;
      container.innerHTML = `
    <section class="hero">
      <h1>Willkommen bei CineRate</h1>
      <p>Bewerte Filme, führe deine Watchlist und entdecke Empfehlungen, die zu deinem Geschmack passen.</p>
      ${registrieren}
    </section>
  `;
}

//--> Inhalt wird im späteren Verlauf noch verändert/erweitert. Zum Beispiel werden angemeldeten Nutzern dann
//    auf der Startseite Empfehlungen angezeigt oder neue Filme