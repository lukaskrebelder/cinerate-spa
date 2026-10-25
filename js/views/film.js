// Ansicht der Filmdetailseite
// Es wird Poster, Titel, Genres, Eckdaten und Beschreibung gezeigt
import { holeFilm } from "../api.js";
import { istSichereBildUrl } from "./filme.js";
import { erzeugeBewertung } from "./bewertung.js";

// Die ID kommt aus der Adresse und ist damit Text. Gültig ist nur eine ganze Zahl ab 1 (die TMDB-ID).
export function istGueltigeFilmId(id) {
  return typeof id === "string" && /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) >= 1;
}

// Übersetzt den Statuscode einer Fehlerantwort in einen deutschen Text für den Nutzer.
// 401 (Sitzung abgelaufen) gehört nicht dazu: Dann wechselt die SPA schon zur Anmeldung.
export function uebersetzeDetailfehler(status) {
  if (status === 404) return "Diesen Film gibt es nicht.";
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  return "Der Film konnte nicht geladen werden. Bitte versuche es später noch einmal.";
}

// Laufzeit in Minuten als Text, zB. 169 --> "2 h 49 min"
export function formatiereLaufzeit(minuten) {
  if (!Number.isInteger(minuten) || minuten <= 0) return "Keine Angabe";
  const stunden = Math.floor(minuten / 60);
  const rest = minuten % 60;
  if (stunden === 0) return `${rest} min`;
  return rest === 0 ? `${stunden} h` : `${stunden} h ${rest} min`;
}

// Altersfreigabe als Text, zB. 12 --> "FSK 12". Ohne Angabe (null) steht dort "Keine Angabe".
export function formatiereFsk(fsk) {
  return [0, 6, 12, 16, 18].includes(fsk) ? `FSK ${fsk}` : "Keine Angabe";
}

// Die Eckdaten, die unter dem Titel stehen, als Paare aus Bezeichnung und Wert.
// Durchschnitt und eigene Bewertung zeigt der Bewertungsbereich (siehe bewertung.js)
export function bestimmeDetails(film) {
  return [
    { bezeichnung: "Erscheinungsjahr", wert: Number.isInteger(film.releaseYear) ? String(film.releaseYear) : "Keine Angabe" },
    { bezeichnung: "Laufzeit", wert: formatiereLaufzeit(film.runtime) },
    { bezeichnung: "Altersfreigabe", wert: formatiereFsk(film.fsk) },
  ];
}

// Baut die Detailansicht. Titel, Beschreibung und Bild-Adresse kommen von außen (TMDB), deshalb werden
// die Elemente einzeln erzeugt und der Text mit textContent gesetzt, nie mit innerHTML.
function erzeugeDetail(film) {
  const artikel = document.createElement("article");
  artikel.className = "film-detail";

  const posterBox = document.createElement("div");
  posterBox.className = "film-detail-poster";
  if (istSichereBildUrl(film.posterUrl)) {
    const bild = document.createElement("img");
    bild.src = film.posterUrl;
    bild.alt = `Poster zu ${film.title}`;
    posterBox.append(bild);
  } else {
    const platzhalter = document.createElement("div");
    platzhalter.className = "film-poster-leer";
    platzhalter.textContent = "Kein Poster";
    posterBox.append(platzhalter);
  }

  const info = document.createElement("div");

  const titel = document.createElement("h1");
  titel.textContent = film.title;
  info.append(titel);

  const genres = Array.isArray(film.genres) ? film.genres : [];
  if (genres.length > 0) {
    const liste = document.createElement("ul");
    liste.className = "genre-liste";
    liste.setAttribute("aria-label", "Genres");
    for (const genre of genres) {
      const eintrag = document.createElement("li");
      eintrag.textContent = genre;
      liste.append(eintrag);
    }
    info.append(liste);
  }

  const daten = document.createElement("dl");
  daten.className = "film-daten";
  for (const { bezeichnung, wert } of bestimmeDetails(film)) {
    const begriff = document.createElement("dt");
    begriff.textContent = bezeichnung;
    const inhalt = document.createElement("dd");
    inhalt.textContent = wert;
    daten.append(begriff, inhalt);
  }
  info.append(daten);
  info.append(erzeugeBewertung(film.movieId));

  const beschreibungTitel = document.createElement("h2");
  beschreibungTitel.textContent = "Beschreibung";
  const beschreibung = document.createElement("p");
  beschreibung.textContent = film.description ?? "Zu diesem Film gibt es keine Beschreibung.";
  info.append(beschreibungTitel, beschreibung);

  artikel.append(posterBox, info);
  return artikel;
}

// parameter kommt vom Router, dort steht die ID aus der Adresse: { movieId: "157336" }
export function zeigeFilm(container, parameter = {}) {
  // Die Beschriftungen stehen fest im Code, deshalb ist innerHTML hier unkritisch.
  container.innerHTML = `
    <p><a class="zurueck-link" href="#/filme">← Zurück zur Filmsuche</a></p>
    <p class="suche-status" id="filmstatus" role="status"></p>
    <div class="fehler" id="filmfehler" role="alert" hidden></div>
    <div id="filmbox"></div>
  `;

  const statusText = container.querySelector("#filmstatus");
  const fehlerBox = container.querySelector("#filmfehler");
  const filmBox = container.querySelector("#filmbox");

  function zeigeFehler(status) {
    statusText.textContent = "";
    fehlerBox.textContent = uebersetzeDetailfehler(status);   // textContent, weil der Text nie als HTML gelten soll
    fehlerBox.hidden = false;
  }

  async function lade(movieId) {
    statusText.textContent = "Film wird geladen ...";
    try {
      const film = await holeFilm(movieId);
      statusText.textContent = "";
      filmBox.replaceChildren(erzeugeDetail(film));
    } catch (fehler) {
      // Bei 401 hat der Sitzungshandler schon zur Anmeldung gewechselt, hier ist nichts mehr zu zeigen
      if (fehler.status === 401) return;
      zeigeFehler(fehler.status);
    }
  }

  // Eine ungültige ID (zB. #/film/abc) wird gar nicht erst ans BFF geschickt
  if (!istGueltigeFilmId(parameter.movieId)) {
    zeigeFehler(404);
    return;
  }
  lade(parameter.movieId);
}