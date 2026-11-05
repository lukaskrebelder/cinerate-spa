// KI-Log B48: Erstellt mithilfe von KI (Claude Sonnett 5.5) – Seite Für dich mit Filmvorschlägen
// Ansicht: Für dich 
// Zeigt bis zu 10 Filmvorschläge, die zu den Bewertungen des Nutzers passen. Das Backend wählt sie über das
// Lieblingsgenre aus: Das ist das Genre, in dem der Nutzer die meisten Filme mit 4 oder 5 Sternen bewertet hat.
import { holeVorschlaege } from "../api.js";
import { erzeugeFilmkarte } from "./filme.js";

const MAX_BESCHREIBUNG = 130;

// Kurzbeschreibung für die Karte. Lange Texte werden an einem Leerzeichen abgeschnitten
// --> Fehlt die Beschreibung, steht ein Hinweis da.
export function kuerzeBeschreibung(text, maximum = MAX_BESCHREIBUNG) {
  if (typeof text !== "string" || text.trim() === "") return "Keine Beschreibung vorhanden.";
  const sauber = text.trim().replace(/\s+/g, " ");
  if (sauber.length <= maximum) return sauber;
  const kurz = sauber.slice(0, maximum);
  const ende = kurz.lastIndexOf(" ");
  return `${(ende > maximum * 0.6 ? kurz.slice(0, ende) : kurz).trimEnd()} …`;
}

// Zeile über den Vorschlägen, zB. "Passend zu deinem Lieblingsgenre: Science Fiction"
export function bestimmeGenreText(genre) {
  if (typeof genre !== "string" || genre.trim() === "") return "Vorschläge, die zu deinen Bewertungen passen";
  return `Passend zu deinem Lieblingsgenre: ${genre}`;
}

// 400 (zu wenig Bewertungen) und 404 (keine neuen Vorschläge) sind keine Störungen, sondern normale Ergebnisse.
// Sie erscheinen als Hinweis. Alles andere ist ein Fehler.
export function bestimmeMeldungsart(status) {
  return status === 400 || status === 404 ? "hinweis" : "fehler";
}

// Übersetzt die Antwort des BFF in einen deutschen Text. Bei 400 unterscheidet die Meldung des Backends, was fehlt.
// 401 (Sitzung abgelaufen) gehört nicht dazu: Dann wechselt die SPA schon zur Anmeldung.
export function uebersetzeVorschlagfehler(status, nachricht = "") {
  if (status === 400) {
    const text = String(nachricht);
    if (text.includes("at least 3")) return "Bewerte zuerst mindestens 3 Filme, dann können wir dir Vorschläge machen.";
    if (text.includes("4 or 5")) return "Bewerte mindestens einen Film mit 4 oder 5 Sternen, damit wir dein Lieblingsgenre erkennen.";
    return "Für Vorschläge brauchen wir mehr Bewertungen von dir.";
  }
  if (status === 404) return "Im Moment gibt es keine neuen Vorschläge für dich.";
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  return "Die Vorschläge konnten nicht geladen werden. Bitte versuche es später noch einmal.";
}

export function zeigeFuerDich(container) {
  // Die Beschriftungen stehen fest im Code, deshalb ist innerHTML hier unkritisch!
  container.innerHTML = `
    <h1>Für dich</h1>
    <p class="fuer-dich-genre" id="fdgenre"></p>
    <p class="suche-status" id="fdstatus" role="status"></p>
    <div class="hinweis" id="fdhinweis" role="status" hidden></div>
    <div class="fehler" id="fdfehler" role="alert" hidden></div>
    <ul class="film-raster vorschlag-raster" id="fdliste"></ul>
  `;

  const genreText = container.querySelector("#fdgenre");
  const statusText = container.querySelector("#fdstatus");
  const hinweisBox = container.querySelector("#fdhinweis");
  const fehlerBox = container.querySelector("#fdfehler");
  const liste = container.querySelector("#fdliste");

  // Hinweis mit Link zu den Filmen: Dort kann man bewerten und bekommt dann Vorschläge
  function zeigeHinweis(text) {
    const link = document.createElement("a");
    link.href = "#/filme";
    link.textContent = "Zu den Filmen";
    hinweisBox.replaceChildren(text, " ", link);   // text wird dabei als Text eingefügt, nie als HTML!
    hinweisBox.hidden = false;
  }

  // Eine Karte wie in der Filmsuche (Poster, Titel, Link zur Detailseite), darunter die Kurzbeschreibung
  function erzeugeVorschlag(film) {
    const karte = erzeugeFilmkarte(film);
    const beschreibung = document.createElement("p");
    beschreibung.className = "film-beschreibung";
    beschreibung.textContent = kuerzeBeschreibung(film.description);
    karte.append(beschreibung);
    return karte;
  }

  async function lade() {
    statusText.textContent = "Vorschläge werden geladen ...";
    try {
      const daten = await holeVorschlaege();
      const filme = Array.isArray(daten.movies) ? daten.movies : [];
      statusText.textContent = "";
      if (filme.length === 0) {
        zeigeHinweis(uebersetzeVorschlagfehler(404));
        return;
      }
      genreText.textContent = bestimmeGenreText(daten.favoriteGenre);
      liste.replaceChildren(...filme.map(erzeugeVorschlag));
    } catch (fehler) {
      // Bei 401 hat der Sitzungshandler schon zur Anmeldung gewechselt, hier ist nichts mehr zu zeigen
      if (fehler.status === 401) return;
      statusText.textContent = "";
      const text = uebersetzeVorschlagfehler(fehler.status, fehler.message);
      if (bestimmeMeldungsart(fehler.status) === "hinweis") {
        zeigeHinweis(text);
      } else {
        fehlerBox.textContent = text;   // textContent, weil der Text nie als HTML gelten soll
        fehlerBox.hidden = false;
      }
    }
  }

  lade();
}