// KI-Log B41: Erstellt mithilfe von KI (Claude Sonnett 5.5) – Ansichten der Watchlist
// Ansichten der Watchlist 
import { holeWatchlist, fuegeZurWatchlistHinzu, entferneVonWatchlist } from "../api.js";
import { erzeugeFilmkarte } from "./filme.js";

const TEXT_LEER = "Deine Watchlist ist leer. Öffne einen Film und wähle „Zur Watchlist hinzufügen“.";

// Steht der Film in der Liste, die das BFF geliefert hat? Es gibt keine Abfrage für einen einzelnen Film.
export function istAufWatchlist(filme, movieId) {
  return Array.isArray(filme) && filme.some((film) => Number(film.movieId) === Number(movieId));
}

// Beschriftung des Knopfes: Er tut immer das Gegenteil des aktuellen Zustands.
export function bestimmeKnopfText(aufWatchlist) {
  return aufWatchlist ? "Von der Watchlist entfernen" : "Zur Watchlist hinzufügen";
}

// Meldung nach dem Klick. aufWatchlist ist der neue Zustand.
export function bestimmeWatchlistBestaetigung(aufWatchlist) {
  return aufWatchlist ? "Der Film wurde zur Watchlist hinzugefügt." : "Der Film wurde von der Watchlist entfernt.";
}

// Hinweis über der Liste: bei einer leeren Watchlist ein Text, sonst nichts
export function bestimmeWatchlistStatus(anzahl) {
  return anzahl === 0 ? TEXT_LEER : "";
}

// Übersetzt den Statuscode einer Fehlerantwort in einen deutschen Text für den Nutzer.
// aktion ist "laden", "hinzufuegen" oder "entfernen". 401 (Sitzung abgelaufen) gehört nicht dazu:
// Dann wechselt die SPA schon zur Anmeldung.
export function uebersetzeWatchlistfehler(status, aktion = "laden") {
  if (status === 409) return "Dieser Film steht schon auf deiner Watchlist.";
  if (status === 404) {
    return aktion === "entfernen" ? "Dieser Film steht nicht auf deiner Watchlist." : "Diesen Film gibt es nicht.";
  }
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  if (aktion === "hinzufuegen") return "Der Film konnte nicht zur Watchlist hinzugefügt werden. Bitte versuche es später noch einmal.";
  if (aktion === "entfernen") return "Der Film konnte nicht von der Watchlist entfernt werden. Bitte versuche es später noch einmal.";
  return "Die Watchlist konnte nicht geladen werden. Bitte versuche es später noch einmal.";
}

// Der Knopf auf der Filmdetailseite. Er lädt beim Erzeugen die Watchlist, um zu wissen, ob der Film schon darauf steht.
// Die Beschriftungen stehen fest im Code, deshalb ist innerHTML hier unkritisch.
export function erzeugeWatchlistKnopf(movieId) {
  const bereich = document.createElement("div");
  bereich.className = "watchlist-bereich";
  bereich.innerHTML = `
    <button class="button" type="button" disabled>Watchlist wird geladen ...</button>
    <p class="suche-status" role="status"></p>
    <div class="fehler" role="alert" hidden></div>
  `;

  const knopf = bereich.querySelector("button");
  const statusText = bereich.querySelector(".suche-status");
  const fehlerBox = bereich.querySelector(".fehler");

  let aufWatchlist = false;   // zuletzt vom Server bekannter Stand

  function zeigeKnopf() {
    knopf.textContent = bestimmeKnopfText(aufWatchlist);
  }

  function zeigeFehler(text) {
    statusText.textContent = "";
    fehlerBox.textContent = text;   // textContent, weil der Text nie als HTML gelten soll
    fehlerBox.hidden = false;
  }

  async function lade() {
    try {
      const daten = await holeWatchlist();
      aufWatchlist = istAufWatchlist(daten.movies, movieId);
      zeigeKnopf();
      knopf.disabled = false;
    } catch (fehler) {
      // Bei 401 hat der Sitzungshandler schon zur Anmeldung gewechselt, hier ist nichts mehr zu zeigen
      if (fehler.status === 401) return;
      knopf.textContent = "Watchlist";
      zeigeFehler(uebersetzeWatchlistfehler(fehler.status, "laden"));   // Der Knopf bleibt gesperrt
    }
  }

  knopf.addEventListener("click", async () => {
    const aktion = aufWatchlist ? "entfernen" : "hinzufuegen";
    knopf.disabled = true;          // verhindert doppeltes Absenden
    fehlerBox.hidden = true;
    statusText.textContent = "";

    try {
      if (aufWatchlist) await entferneVonWatchlist(movieId);
      else await fuegeZurWatchlistHinzu(movieId);
      aufWatchlist = !aufWatchlist;
      statusText.textContent = bestimmeWatchlistBestaetigung(aufWatchlist);
    } catch (fehler) {
      if (fehler.status === 401) return;
      // Der Server steht schon so, wie der Nutzer es wollte (409 beim Hinzufügen, 404 beim Entfernen):
      // Dann stimmt nur die Anzeige nicht mehr und wird angeglichen.
      if (fehler.status === 409 && aktion === "hinzufuegen") aufWatchlist = true;
      if (fehler.status === 404 && aktion === "entfernen") aufWatchlist = false;
      zeigeFehler(uebersetzeWatchlistfehler(fehler.status, aktion));
    }

    zeigeKnopf();
    knopf.disabled = false;
    knopf.focus();                  // gesperrte Elemente verlieren den Fokus, so kann man mit der Tastatur weitermachen
  });

  lade();
  return bereich;
}

// Die Seite #/watchlist. Jede Karte ist wie in der Filmsuche ein Link auf die Detailseite, darunter steht ein Knopf zum Entfernen.
export function zeigeWatchlist(container) {
  // Die Beschriftungen stehen fest im Code, deshalb ist innerHTML hier unkritisch.
  container.innerHTML = `
    <h1>Meine Watchlist</h1>
    <p class="suche-status" id="wlstatus" role="status"></p>
    <div class="fehler" id="wlfehler" role="alert" hidden></div>
    <ul class="film-raster" id="wlliste"></ul>
  `;

  const statusText = container.querySelector("#wlstatus");
  const fehlerBox = container.querySelector("#wlfehler");
  const liste = container.querySelector("#wlliste");

  function zeigeFehler(text) {
    fehlerBox.textContent = text;   // textContent, weil der Text nie als HTML gelten soll
    fehlerBox.hidden = false;
  }

  // Nach dem Entfernen verschwindet die Karte. War es die letzte, erscheint der Hinweis zur leeren Watchlist.
  function nimmKarteWeg(karte, meldung) {
    karte.remove();
    const leer = bestimmeWatchlistStatus(liste.children.length);
    statusText.textContent = leer !== "" ? leer : meldung;
  }

  function erzeugeKarte(film) {
    const karte = erzeugeFilmkarte(film);

    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "button karte-knopf";
    knopf.textContent = "Entfernen";
    knopf.setAttribute("aria-label", `${film.title} von der Watchlist entfernen`);

    knopf.addEventListener("click", async () => {
      knopf.disabled = true;
      fehlerBox.hidden = true;
      try {
        await entferneVonWatchlist(film.movieId);
        nimmKarteWeg(karte, `${film.title} wurde von der Watchlist entfernt.`);
      } catch (fehler) {
        if (fehler.status === 401) return;
        if (fehler.status === 404) {
          nimmKarteWeg(karte, "");   // Der Film stand gar nicht mehr darauf, die Karte ist überholt
        } else {
          knopf.disabled = false;
        }
        zeigeFehler(uebersetzeWatchlistfehler(fehler.status, "entfernen"));
      }
    });

    karte.append(knopf);
    return karte;
  }

  async function lade() {
    statusText.textContent = "Watchlist wird geladen ...";
    try {
      const daten = await holeWatchlist();
      const filme = Array.isArray(daten.movies) ? daten.movies : [];
      liste.replaceChildren(...filme.map(erzeugeKarte));
      statusText.textContent = bestimmeWatchlistStatus(filme.length);
    } catch (fehler) {
      // Bei 401 hat der Sitzungshandler schon zur Anmeldung gewechselt, hier ist nichts mehr zu zeigen
      if (fehler.status === 401) return;
      statusText.textContent = "";
      zeigeFehler(uebersetzeWatchlistfehler(fehler.status, "laden"));
    }
  }

  lade();
}