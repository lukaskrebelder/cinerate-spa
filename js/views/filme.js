// Ansicht: Filmsuche (US-5, PB-07 bis PB-09).
// Ablauf: Beim Öffnen wird die Standardliste geladen. Wer Titel oder Genre eingibt und auf "Suchen" klickt,
// bekommt die passenden Filme als Karten (Poster mit Titel darunter)
import { sucheFilme } from "../api.js";
import { GENRES } from "../genres.js"; 

// Übersetzt den Statuscode einer Fehlerantwort in einen deutschen Text für den Nutzer.
// 401 (Sitzung abgelaufen) gehört nicht dazu: Dann wechselt die SPA schon zur Anmeldung.
export function uebersetzeSuchfehler(status) {
  if (status === 400) return "Bitte prüfe deine Eingaben.";
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  return "Die Suche ist fehlgeschlagen. Bitte versuche es später noch einmal.";
}

// Bilder kommen von TMDB. Nur Adressen von dort werden angezeigt, alles andere bekommt den Platzhalter.
export function istSichereBildUrl(url) {
  return typeof url === "string" && url.startsWith("https://image.tmdb.org/");
}

// Text und Zustand der Knöpfe unter der Trefferliste, z. B. "Seite 2 von 5"
export function bestimmeSeitenanzeige(seite, gesamtSeiten) {
  const gesamt = Number.isInteger(gesamtSeiten) && gesamtSeiten >= 1 ? gesamtSeiten : 1;
  return {
    text: `Seite ${seite} von ${gesamt}`,
    hatZurueck: seite > 1,
    hatWeiter: seite < gesamt,
  };
}

// Eine Karte für einen Film. Titel und Bild-Adresse kommen von außen (TMDB), 
// deshalb werden die Elemente einzeln erzeugt und der Text mit textContent gesetzt (nie mit innerHTML)
// Die ganze Karte ist ein Link auf die Detailseite
export function erzeugeFilmkarte(film) {
  const karte = document.createElement("li");
  karte.className = "film-karte";

  // Ohne ganze Zahl als ID (sollte nicht vorkommen) bleibt die Karte ein einfacher Block ohne Link
  const hatId = Number.isInteger(film.movieId);
  const inhalt = document.createElement(hatId ? "a" : "div");
  if (hatId) {
    inhalt.className = "film-link";
    inhalt.href = `#/film/${film.movieId}`;
  }

  if (istSichereBildUrl(film.posterUrl)) {
    const bild = document.createElement("img");
    bild.src = film.posterUrl;
    bild.alt = `Poster zu ${film.title}`;
    bild.loading = "lazy";            // Bilder werden erst geladen, wenn sie in Sicht kommen
    inhalt.append(bild);
  } else {
    const platzhalter = document.createElement("div");
    platzhalter.className = "film-poster-leer";
    platzhalter.textContent = "Kein Poster";
    inhalt.append(platzhalter);
  }

  const titel = document.createElement("p");
  titel.className = "film-titel";
  titel.textContent = film.title;
  inhalt.append(titel);

  karte.append(inhalt);
  return karte;
}

export function zeigeFilme(container) {
  // Die Beschriftungen stehen fest im Code --> innerHTML hier unkritisch.
  container.innerHTML = `
    <h1>Filme</h1>
    <form class="suche" id="suche" novalidate>
      <div class="suche-feld">
        <label for="titel">Titel</label>
        <input id="titel" name="query" type="search" autocomplete="off" />
      </div>
      <div class="suche-feld">
        <label for="genre">Genre</label>
        <select id="genre" name="genre"><option value="">Alle Genres</option></select>
      </div>
      <button class="button" type="submit">Suchen</button>
    </form>

    <p class="suche-status" id="suchstatus" role="status"></p>
    <div class="fehler" id="fehler" role="alert" hidden></div>
    <ul class="film-raster" id="ergebnisse"></ul>

    <nav class="seiten-navigation" id="seiten" aria-label="Seiten der Trefferliste" hidden>
      <button class="button" type="button" id="zurueck">Zurück</button>
      <span id="seitenzahl"></span>
      <button class="button" type="button" id="weiter">Weiter</button>
    </nav>
  `;

  const formular = container.querySelector("#suche");
  const suchKnopf = formular.querySelector("button");
  const genreAuswahl = container.querySelector("#genre");
  const statusText = container.querySelector("#suchstatus");
  const fehlerBox = container.querySelector("#fehler");
  const ergebnisse = container.querySelector("#ergebnisse");
  const seitenNavigation = container.querySelector("#seiten");
  const seitenZahl = container.querySelector("#seitenzahl");
  const zurueckKnopf = container.querySelector("#zurueck");
  const weiterKnopf = container.querySelector("#weiter");

  // Die Genres kommen aus genres.js. Text wird mit textContent gesetzt.
  for (const genre of GENRES) {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreAuswahl.append(option);
  }

  let suche = { query: "", genre: "" };   // die zuletzt abgeschickte Suche
  let seite = 1;
  let gesamtSeiten = 1;
  let anfrageNummer = 0;                  // erkennt veraltete Antworten, wenn schnell mehrmals gesucht wird

  function sperre(gesperrt) {
    suchKnopf.disabled = gesperrt;
    zurueckKnopf.disabled = gesperrt || !bestimmeSeitenanzeige(seite, gesamtSeiten).hatZurueck;
    weiterKnopf.disabled = gesperrt || !bestimmeSeitenanzeige(seite, gesamtSeiten).hatWeiter;
  }

  function zeigeErgebnis(ergebnis) {
    seite = ergebnis.page;
    gesamtSeiten = ergebnis.totalPages;

    ergebnisse.replaceChildren(...ergebnis.movies.map(erzeugeFilmkarte));

    if (ergebnis.movies.length === 0) {
      statusText.textContent = "Keine Filme gefunden.";
      seitenNavigation.hidden = true;
      return;
    }
    statusText.textContent = "";
    const anzeige = bestimmeSeitenanzeige(seite, gesamtSeiten);
    seitenZahl.textContent = anzeige.text;
    seitenNavigation.hidden = false;
  }

  async function lade(gewuenschteSeite) {
    const nummer = ++anfrageNummer;
    statusText.textContent = "Filme werden geladen ...";
    fehlerBox.hidden = true;
    sperre(true);

    try {
      const ergebnis = await sucheFilme({ ...suche, page: gewuenschteSeite });
      if (nummer !== anfrageNummer) return;   // eine neuere Suche läuft schon
      zeigeErgebnis(ergebnis);
    } catch (fehler) {
      if (nummer !== anfrageNummer) return;
      // Bei 401 hat der Sitzungshandler schon zur Anmeldung gewechselt, hier ist nichts mehr zu zeigen
      if (fehler.status === 401) return;
      ergebnisse.replaceChildren();
      seitenNavigation.hidden = true;
      statusText.textContent = "";
      fehlerBox.textContent = uebersetzeSuchfehler(fehler.status);   // textContent, weil der Text nie als HTML gelten soll
      fehlerBox.hidden = false;
    }
    if (nummer === anfrageNummer) sperre(false);
  }

  formular.addEventListener("submit", (ereignis) => {
    ereignis.preventDefault();       // verhindert, dass der Browser die Seite neu lädt
    const daten = Object.fromEntries(new FormData(formular));
    suche = { query: daten.query ?? "", genre: daten.genre ?? "" };
    lade(1);
  });

  zurueckKnopf.addEventListener("click", () => lade(seite - 1));
  weiterKnopf.addEventListener("click", () => lade(seite + 1));

  lade(1);   // beim Öffnen: Standardliste
}