// Bewertungsbereich der Filmdetailseite (Mithilfe von Claude Sonnett 5.5)
// Zeigt Durchschnitt, Anzahl und die eigene Bewertung und lässt den Nutzer 1 bis 5 Sterne vergeben.
// Wer schon bewertet hat, ändert die Bewertung mit einem Klick auf einen anderen Stern 
import { holeBewertungen, bewerteFilm } from "../api.js";

const MAX_STERNE = 5;

// Gültig sind ganze Zahlen von 1 bis 5.
export function istGueltigeSterne(sterne) {
  return Number.isInteger(sterne) && sterne >= 1 && sterne <= MAX_STERNE;
}

// Durchschnitt und Anzahl als Text mit Komma
// Ohne Bewertung liefert das Backend null und 0.
export function formatiereDurchschnitt(durchschnitt, anzahl) {
  if (typeof durchschnitt !== "number" || Number.isNaN(durchschnitt) || !Number.isInteger(anzahl) || anzahl < 1) {
    return "Noch keine Bewertungen";
  }
  const anzahlText = anzahl === 1 ? "1 Bewertung" : `${anzahl} Bewertungen`;
  return `${durchschnitt.toFixed(1).replace(".", ",")} von 5 (${anzahlText})`;
}

// Die eigene Bewertung als Text, zB. 4 --> "Deine Bewertung: 4 Sterne". Ohne Bewertung (null) steht ein Hinweis da.
export function formatiereEigeneBewertung(sterne) {
  if (!istGueltigeSterne(sterne)) return "Du hast diesen Film noch nicht bewertet.";
  return `Deine Bewertung: ${sterne} ${sterne === 1 ? "Stern" : "Sterne"}`;
}

// Welche der fünf Sterne gefüllt sind, zB. 3 --> [true, true, true, false, false]
export function bestimmeGefuellteSterne(sterne) {
  return Array.from({ length: MAX_STERNE }, (_, index) => istGueltigeSterne(sterne) && index + 1 <= sterne);
}

// Meldung nach dem Speichern: neu bewertet oder die bisherige Bewertung geändert
export function bestimmeBestaetigung(hatteBewertung) {
  return hatteBewertung ? "Deine Bewertung wurde geändert." : "Danke für deine Bewertung!";
}

// Übersetzt den Statuscode einer Fehlerantwort in einen deutschen Text für den Nutzer.
// aktion ist "laden" oder "speichern". 401 (Sitzung abgelaufen) gehört nicht dazu: Dann wechselt die SPA schon zur Anmeldung.
export function uebersetzeBewertungsfehler(status, aktion = "speichern") {
  if (status === 400) return "Bitte wähle 1 bis 5 Sterne.";
  if (status === 404) return "Diesen Film gibt es nicht.";
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  return aktion === "laden"
    ? "Die Bewertungen konnten nicht geladen werden. Bitte versuche es später noch einmal."
    : "Deine Bewertung konnte nicht gespeichert werden. Bitte versuche es später noch einmal.";
}

// Baut den Bewertungsbereich für einen Film und lädt die Bewertungen vom BFF.
// Alle Texte stehen fest im Code oder sind Zahlen vom Server, deshalb ist innerHTML hier unkritisch.
export function erzeugeBewertung(movieId) {
  const bereich = document.createElement("section");
  bereich.className = "bewertung";
  bereich.innerHTML = `
    <h2>Bewertung</h2>
    <p class="bewertung-durchschnitt"></p>
    <p class="bewertung-eigene"></p>
    <fieldset class="bewertung-eingabe">
      <legend>Film bewerten</legend>
      <div class="sterne"></div>
    </fieldset>
    <p class="suche-status" role="status"></p>
    <div class="fehler" role="alert" hidden></div>
  `;

  const durchschnittText = bereich.querySelector(".bewertung-durchschnitt");
  const eigeneText = bereich.querySelector(".bewertung-eigene");
  const eingabe = bereich.querySelector(".bewertung-eingabe");
  const sterneBox = bereich.querySelector(".sterne");
  const statusText = bereich.querySelector(".suche-status");
  const fehlerBox = bereich.querySelector(".fehler");

  // Fünf Auswahlkreise (radio) mit je einem Stern als Beschriftung. So lassen sie sich auch mit
  // Tastatur (Pfeiltasten) und Screenreader bedienen. Der Kreis selbst ist absichtlich aber unsichtbar.
  const radios = [];
  const beschriftungen = [];
  for (let zahl = 1; zahl <= MAX_STERNE; zahl++) {
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `sterne-${movieId}`;
    radio.id = `stern-${movieId}-${zahl}`;
    radio.value = String(zahl);

    const beschriftung = document.createElement("label");
    beschriftung.htmlFor = radio.id;
    beschriftung.className = "stern";
    beschriftung.append("★");
    const lesetext = document.createElement("span");
    lesetext.className = "nur-lesen";
    lesetext.textContent = zahl === 1 ? "1 Stern" : `${zahl} Sterne`;
    beschriftung.append(lesetext);

    sterneBox.append(radio, beschriftung);
    radios.push(radio);
    beschriftungen.push(beschriftung);
  }

  let zustand = { durchschnitt: null, anzahl: 0, eigene: null };   // zuletzt vom Server bekannter Stand

  function zeigeZustand() {
    durchschnittText.textContent = formatiereDurchschnitt(zustand.durchschnitt, zustand.anzahl);
    eigeneText.textContent = formatiereEigeneBewertung(zustand.eigene);
    const gefuellt = bestimmeGefuellteSterne(zustand.eigene);
    radios.forEach((radio, index) => {
      radio.checked = zustand.eigene === index + 1;
      beschriftungen[index].classList.toggle("gefuellt", gefuellt[index]);
    });
  }

  function zeigeFehler(text) {
    statusText.textContent = "";
    fehlerBox.textContent = text;   // textContent, weil der Text nie als HTML gelten soll
    fehlerBox.hidden = false;
  }

  // Gesperrt wird die ganze Gruppe, während eine Anfrage läuft (verhindert doppeltes Absenden)
  function sperre(gesperrt) {
    eingabe.disabled = gesperrt;
  }

  function uebernehme(daten) {
    zustand = { durchschnitt: daten.avgRating ?? null, anzahl: daten.ratingCount ?? 0, eigene: daten.ownStars ?? null };
    zeigeZustand();
  }

  async function lade() {
    statusText.textContent = "Bewertungen werden geladen ...";
    fehlerBox.hidden = true;
    sperre(true);
    try {
      uebernehme(await holeBewertungen(movieId));
      statusText.textContent = "";
      sperre(false);
    } catch (fehler) {
      // Bei 401 hat der Sitzungshandler schon zur Anmeldung gewechselt, hier ist nichts mehr zu zeigen
      if (fehler.status === 401) return;
      zeigeFehler(uebersetzeBewertungsfehler(fehler.status, "laden"));   // Die Eingabe bleibt gesperrt
    }
  }

  async function speichere(sterne) {
    const hatteBewertung = zustand.eigene !== null;
    const angeklickt = radios[sterne - 1];
    statusText.textContent = "Bewertung wird gespeichert ...";
    fehlerBox.hidden = true;
    sperre(true);

    try {
      await bewerteFilm(movieId, sterne);
    } catch (fehler) {
      if (fehler.status === 401) return;
      zeigeZustand();   // die Auswahl springt zurück auf die zuletzt gespeicherte Bewertung
      zeigeFehler(uebersetzeBewertungsfehler(fehler.status, "speichern"));
      sperre(false);
      angeklickt.focus();   // gesperrte Elemente verlieren den Fokus, so kann man mit der Tastatur weitermachen
      return;
    }

    zustand.eigene = sterne;
    zeigeZustand();
    statusText.textContent = bestimmeBestaetigung(hatteBewertung);
    sperre(false);
    angeklickt.focus();

    // Durchschnitt und Anzahl haben sich geändert, deshalb werden sie neu geholt
    try {
      uebernehme(await holeBewertungen(movieId));
    } catch {
      // Die Bewertung ist gespeichert. Der Durchschnitt wird beim nächsten Öffnen der Seite wieder aktuell.
    }
  }

  sterneBox.addEventListener("change", (ereignis) => {
    const sterne = Number(ereignis.target.value);
    if (istGueltigeSterne(sterne)) speichere(sterne);
  });

  zeigeZustand();
  lade();
  return bereich;
}