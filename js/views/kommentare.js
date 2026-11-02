// KI-Log B51: Erstellt mithilfe von KI (Claude Sonnett 5.5) – Hilfsfunktionen und Fehlertexte der Kommentare
// Kommentare zu einem Film: schreiben, lesen (20 pro Seite, neueste zuerst) sowie eigene Kommentare bearbeiten und löschen.
import { holeKommentare, schreibeKommentar, aendereKommentar, loescheKommentar } from "../api.js";
import { holeUserId } from "../auth.js";
import { bestimmeSeitenanzeige } from "./filme.js";

export const MAX_KOMMENTAR_LAENGE = 500;

// Prüft den Text vor dem Senden. Leerzeichen am Rand zählen nicht, gültig sind 1 bis 500 Zeichen.
// Liefert den bereinigten Text und, wenn er nicht passt, den Fehlertext (sonst null).
export function pruefeKommentartext(eingabe) {
  const text = typeof eingabe === "string" ? eingabe.trim() : "";
  if (text.length < 1) return { text, fehler: "Bitte schreibe einen Kommentar." };
  if (text.length > MAX_KOMMENTAR_LAENGE) {
    return { text, fehler: `Ein Kommentar darf höchstens ${MAX_KOMMENTAR_LAENGE} Zeichen lang sein.` };
  }
  return { text, fehler: null };
}

// Zeichenzähler unter dem Eingabefeld, zB. "12 / 500"
export function formatiereZeichenzaehler(eingabe) {
  const laenge = typeof eingabe === "string" ? eingabe.length : 0;
  return `${laenge} / ${MAX_KOMMENTAR_LAENGE}`;
}

// Der Server liefert die Zeit als UTC-Text, zB. "2026-10-01T18:30:00Z".
// Angezeigt wird sie in deutscher Zeit (Sommer- und Winterzeit inklusive): "01.10.2026, 20:30 Uhr".
// Die Teile werden einzeln zusammengesetzt, damit die Ausgabe nicht von der Version der Browsersprache abhängt.
const ZEITFORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatiereZeitpunkt(iso) {
  if (typeof iso !== "string") return "";
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return "";
  const teile = Object.fromEntries(ZEITFORMAT.formatToParts(datum).map((teil) => [teil.type, teil.value]));
  return `${teile.day}.${teile.month}.${teile.year}, ${teile.hour}:${teile.minute} Uhr`;
}

// Zeile unter dem Namen: wann der Kommentar geschrieben wurde und, falls er geändert wurde, wann
export function formatiereKommentarzeit(kommentar) {
  const geschrieben = formatiereZeitpunkt(kommentar.createdAt);
  const geaendert = formatiereZeitpunkt(kommentar.updatedAt);
  return geaendert === "" ? geschrieben : `${geschrieben} (bearbeitet am ${geaendert})`;
}

// Was darf der Nutzer mit diesem Kommentar tun? Bearbeiten und Löschen darf nur der Autor.
// Die ID des angemeldeten Nutzers (zB. "u_58") kommt vom Login, siehe auth.js.
export function bestimmeKommentarrechte(kommentar, userId) {
  const eigener = typeof userId === "string" && userId !== "" && kommentar.userId === userId;
  return { aendern: eigener, loeschen: eigener };
}

// Wird nach dem Löschen die letzte Seite leer, geht es eine Seite zurück. Sonst bleibt es bei der Seite.
export function bestimmeZielseite(seite, anzahlKommentare) {
  return seite > 1 && anzahlKommentare === 0 ? seite - 1 : seite;
}

// Übersetzt den Statuscode einer Fehlerantwort in einen deutschen Text für den Nutzer.
// aktion ist "laden", "speichern", "aendern" oder "loeschen".
// 401 (Sitzung abgelaufen) gehört nicht dazu: Dann wechselt die SPA schon zur Anmeldung.
const STANDARDFEHLER = {
  laden: "Die Kommentare konnten nicht geladen werden. Bitte versuche es später noch einmal.",
  speichern: "Dein Kommentar konnte nicht gesendet werden. Bitte versuche es später noch einmal.",
  aendern: "Dein Kommentar konnte nicht geändert werden. Bitte versuche es später noch einmal.",
  loeschen: "Der Kommentar konnte nicht gelöscht werden. Bitte versuche es später noch einmal.",
};

export function uebersetzeKommentarfehler(status, aktion = "speichern") {
  if (status === 400) return `Ein Kommentar muss zwischen 1 und ${MAX_KOMMENTAR_LAENGE} Zeichen lang sein.`;
  if (status === 403) {
    return aktion === "loeschen"
      ? "Du kannst nur deine eigenen Kommentare löschen."
      : "Du kannst nur deine eigenen Kommentare ändern.";
  }
  if (status === 404) {
    return aktion === "aendern" || aktion === "loeschen" ? "Diesen Kommentar gibt es nicht mehr." : "Diesen Film gibt es nicht.";
  }
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  return STANDARDFEHLER[aktion] ?? STANDARDFEHLER.speichern;
}

// Ein Knopf, der beim Klick die übergebene Funktion aufruft
function erzeugeKnopf(beschriftung, klassen, beiKlick) {
  const knopf = document.createElement("button");
  knopf.type = "button";
  knopf.className = `button ${klassen}`.trim();
  knopf.textContent = beschriftung;
  knopf.addEventListener("click", () => beiKlick());
  return knopf;
}

// KI-Log B52: Erstellt mithilfe von KI (Claude Sonnett 5.5) – Kommentarbereich mit Liste, Eingabe, Seitenwechsel, Bearbeiten und Löschen
// Baut den Kommentarbereich für einen Film und lädt die erste Seite der Kommentare vom BFF.
// Namen und Texte der Kommentare kommen von anderen Nutzern, deshalb werden sie nur mit textContent gesetzt.
// Nur die festen Beschriftungen stehen per innerHTML im Code, die Film-ID wird nie in HTML eingebaut.
export function erzeugeKommentare(movieId) {
  const bereich = document.createElement("section");
  bereich.className = "kommentare";
  bereich.innerHTML = `
    <h2>Kommentare</h2>
    <form class="kommentar-formular" novalidate>
      <label>Dein Kommentar</label>
      <textarea name="text" rows="3" maxlength="${MAX_KOMMENTAR_LAENGE}"></textarea>
      <p class="kommentar-zaehler"></p>
      <button class="button" type="submit">Kommentar senden</button>
    </form>
    <p class="suche-status" role="status"></p>
    <div class="fehler" role="alert" hidden></div>
    <ul class="kommentar-liste"></ul>
    <nav class="seiten-navigation" aria-label="Seiten der Kommentare" hidden>
      <button class="button" type="button" data-richtung="zurueck">Zurück</button>
      <span></span>
      <button class="button" type="button" data-richtung="weiter">Weiter</button>
    </nav>
  `;

  const formular = bereich.querySelector(".kommentar-formular");
  const beschriftung = formular.querySelector("label");
  const eingabeFeld = formular.querySelector("textarea");
  const zaehler = formular.querySelector(".kommentar-zaehler");
  const statusText = bereich.querySelector(".suche-status");
  const fehlerBox = bereich.querySelector(".fehler");
  const liste = bereich.querySelector(".kommentar-liste");
  const seitenNavigation = bereich.querySelector(".seiten-navigation");
  const seitenZahl = seitenNavigation.querySelector("span");
  const zurueckKnopf = seitenNavigation.querySelector('[data-richtung="zurueck"]');
  const weiterKnopf = seitenNavigation.querySelector('[data-richtung="weiter"]');

  // Das Feld braucht eine eindeutige ID, damit die Beschriftung zu ihm gehört
  eingabeFeld.id = `kommentar-text-${movieId}`;
  beschriftung.htmlFor = eingabeFeld.id;

  const userId = holeUserId();   // null bei einer älteren Anmeldung: Dann gibt es keine Knöpfe zum Bearbeiten
  let seite = 1;
  let gesamtSeiten = 1;
  let anfrageNummer = 0;         // erkennt veraltete Antworten, wenn schnell mehrmals geladen wird
  let gesperrt = false;          // true, solange eine Anfrage läuft

  function aktualisiereZaehler() {
    zaehler.textContent = formatiereZeichenzaehler(eingabeFeld.value);
  }

  function zeigeFehler(text) {
    statusText.textContent = "";
    fehlerBox.textContent = text;   // textContent, weil der Text nie als HTML gelten soll
    fehlerBox.hidden = false;
  }

  // Während eine Anfrage läuft, sind alle Knöpfe und Felder gesperrt (verhindert doppeltes Absenden).
  // Danach richten sich Zurück und Weiter wieder nach der aktuellen Seite.
  function sperre(wert) {
    gesperrt = wert;
    for (const element of bereich.querySelectorAll("button, textarea")) element.disabled = wert;
    if (!wert) {
      const anzeige = bestimmeSeitenanzeige(seite, gesamtSeiten);
      zurueckKnopf.disabled = !anzeige.hatZurueck;
      weiterKnopf.disabled = !anzeige.hatWeiter;
    }
  }

  // Ein Kommentar der Liste. Eigene Kommentare haben Knöpfe zum Bearbeiten und Löschen.
  function erzeugeEintrag(kommentar) {
    const eintrag = document.createElement("li");
    eintrag.className = "kommentar";

    const kopf = document.createElement("div");
    kopf.className = "kommentar-kopf";
    const autor = document.createElement("strong");
    autor.textContent = kommentar.firstName;
    const zeit = document.createElement("span");
    zeit.className = "kommentar-zeit";
    zeit.textContent = formatiereKommentarzeit(kommentar);
    kopf.append(autor, zeit);

    const text = document.createElement("p");
    text.className = "kommentar-text";
    text.textContent = kommentar.text;

    eintrag.append(kopf, text);

    const rechte = bestimmeKommentarrechte(kommentar, userId);
    if (!rechte.aendern && !rechte.loeschen) return eintrag;

    const aktionen = document.createElement("div");
    aktionen.className = "kommentar-aktionen";
    eintrag.append(aktionen);

    function zeigeAktionen() {
      aktionen.replaceChildren(
        erzeugeKnopf("Bearbeiten", "klein", zeigeBearbeitung),
        erzeugeKnopf("Löschen", "klein gefahr", zeigeLoeschfrage)
      );
    }

    // Löschen mit Rückfrage, weil ein gelöschter Kommentar nicht wiederkommt
    function zeigeLoeschfrage() {
      const frage = document.createElement("span");
      frage.textContent = "Kommentar wirklich löschen?";
      aktionen.replaceChildren(
        frage,
        erzeugeKnopf("Ja, löschen", "klein gefahr", loesche),
        erzeugeKnopf("Abbrechen", "klein", zeigeAktionen)
      );
    }

    async function loesche() {
      fehlerBox.hidden = true;
      statusText.textContent = "Kommentar wird gelöscht ...";
      sperre(true);
      try {
        await loescheKommentar(movieId, kommentar.commentId);
      } catch (fehler) {
        if (fehler.status === 401) return;
        if (fehler.status === 404) await lade(seite);   // der Kommentar war schon weg: Die Liste zeigt den aktuellen Stand
        zeigeFehler(uebersetzeKommentarfehler(fehler.status, "loeschen"));
        sperre(false);
        return;
      }
      await lade(seite);     // wird die Seite dadurch leer, geht lade() eine Seite zurück
      if (fehlerBox.hidden) statusText.textContent = "Der Kommentar wurde gelöscht.";
    }

    // Der Text wird durch ein Eingabefeld ersetzt, bis gespeichert oder abgebrochen wird
    function zeigeBearbeitung() {
      const feld = document.createElement("textarea");
      feld.className = "kommentar-bearbeiten";
      feld.rows = 3;
      feld.maxLength = MAX_KOMMENTAR_LAENGE;
      feld.value = kommentar.text;
      feld.setAttribute("aria-label", "Kommentar bearbeiten");
      text.replaceWith(feld);
      aktionen.replaceChildren(erzeugeKnopf("Speichern", "klein", speichere), erzeugeKnopf("Abbrechen", "klein", abbrechen));
      feld.focus();

      function abbrechen() {
        fehlerBox.hidden = true;
        feld.replaceWith(text);
        zeigeAktionen();
      }

      async function speichere() {
        const { text: neuerText, fehler } = pruefeKommentartext(feld.value);
        if (fehler) {
          zeigeFehler(fehler);
          feld.focus();
          return;
        }
        if (neuerText === kommentar.text) {   // nichts geändert: kein Aufruf nötig
          abbrechen();
          return;
        }
        fehlerBox.hidden = true;
        statusText.textContent = "Änderung wird gespeichert ...";
        sperre(true);
        try {
          await aendereKommentar(movieId, kommentar.commentId, neuerText);
        } catch (fehlerAntwort) {
          if (fehlerAntwort.status === 401) return;
          zeigeFehler(uebersetzeKommentarfehler(fehlerAntwort.status, "aendern"));
          sperre(false);
          feld.focus();
          return;
        }
        await lade(seite);   // die Liste zeigt dann den geänderten Text mit dem Hinweis "bearbeitet"
        if (fehlerBox.hidden) statusText.textContent = "Dein Kommentar wurde geändert.";
      }
    }

    zeigeAktionen();
    return eintrag;
  }

  function zeigeKommentare(ergebnis) {
    seite = ergebnis.page;
    gesamtSeiten = ergebnis.totalPages;
    liste.replaceChildren(...ergebnis.comments.map(erzeugeEintrag));

    statusText.textContent = ergebnis.comments.length === 0 ? "Noch keine Kommentare. Schreibe den ersten!" : "";
    seitenZahl.textContent = bestimmeSeitenanzeige(seite, gesamtSeiten).text;
    seitenNavigation.hidden = gesamtSeiten <= 1;
  }

  async function lade(gewuenschteSeite) {
    const nummer = ++anfrageNummer;
    statusText.textContent = "Kommentare werden geladen ...";
    fehlerBox.hidden = true;
    sperre(true);

    try {
      const ergebnis = await holeKommentare(movieId, gewuenschteSeite);
      if (nummer !== anfrageNummer) return;   // eine neuere Anfrage läuft schon
      const ziel = bestimmeZielseite(ergebnis.page, ergebnis.comments.length);
      if (ziel !== ergebnis.page) {
        await lade(ziel);                     // die Seite ist leer geworden (zB. nach dem Löschen)
        return;
      }
      zeigeKommentare(ergebnis);
    } catch (fehler) {
      if (nummer !== anfrageNummer) return;
      // Bei 401 hat der Sitzungshandler schon zur Anmeldung gewechselt, hier ist nichts mehr zu zeigen
      if (fehler.status === 401) return;
      zeigeFehler(uebersetzeKommentarfehler(fehler.status, "laden"));
    }
    if (nummer === anfrageNummer) sperre(false);
  }

  formular.addEventListener("submit", async (ereignis) => {
    ereignis.preventDefault();       // verhindert, dass der Browser die Seite neu lädt
    if (gesperrt) return;            // es läuft schon eine Anfrage: nichts doppelt senden
    const { text, fehler } = pruefeKommentartext(eingabeFeld.value);
    if (fehler) {
      zeigeFehler(fehler);
      eingabeFeld.focus();
      return;
    }

    fehlerBox.hidden = true;
    statusText.textContent = "Kommentar wird gesendet ...";
    sperre(true);
    try {
      await schreibeKommentar(movieId, text);
    } catch (fehlerAntwort) {
      if (fehlerAntwort.status === 401) return;
      zeigeFehler(uebersetzeKommentarfehler(fehlerAntwort.status, "speichern"));
      sperre(false);
      eingabeFeld.focus();           // der geschriebene Text bleibt im Feld stehen
      return;
    }

    eingabeFeld.value = "";
    aktualisiereZaehler();
    await lade(1);                   // neueste zuerst: Der neue Kommentar steht auf Seite 1 ganz oben
    if (fehlerBox.hidden) statusText.textContent = "Dein Kommentar wurde veröffentlicht.";
  });

  eingabeFeld.addEventListener("input", aktualisiereZaehler);
  zurueckKnopf.addEventListener("click", () => lade(seite - 1));
  weiterKnopf.addEventListener("click", () => lade(seite + 1));

  aktualisiereZaehler();
  lade(1);
  return bereich;
}