// Ansicht

// --> Funktion, die ihren Inhalt in den übergebenen Container schreibt
// --> Der Router in router.js ruft sie dann auf, wenn die Adresse passt

// innterHTML ist hier unkritisch, da der Text fest im Code steht. Sobald jedoch Texte von Nutzern 
// oder vom BFF kommen (bspw. Filmtitel/Kommentare), muss stattdessen "textContent" genutzt werden
// --> wichtig, um Schadcode zu verhindern!
export function zeigeStartseite(container){
      container.innerHTML = `
    <section class="hero">
      <h1>Willkommen bei CineRate</h1>
      <p>Bewerte Filme, führe deine Watchlist und entdecke Empfehlungen, die zu deinem Geschmack passen.</p>
      <a class="button" href="#/registrieren">Jetzt registrieren</a>
    </section>
  `;
}