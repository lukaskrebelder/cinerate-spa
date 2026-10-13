// Ansicht: Anmeldung (US-2).
// Ablauf: Eingaben prüfen -> an das BFF senden -> Token speichern und zur Startseite wechseln.
import { meldeAn } from "../api.js";
import { speichereToken } from "../auth.js";
import { findeAnmeldefehler } from "../validierung.js";

// Übersetzt den Statuscode einer Fehlerantwort in einen deutschen Text für den Nutzer.
// Bei 401 steht absichtlich nicht, ob die E-Mail oder das Passwort falsch war.
export function uebersetzeAnmeldefehler(status) {
  if (status === 400) return "Bitte gib E-Mail-Adresse und Passwort ein.";
  if (status === 401) return "E-Mail-Adresse oder Passwort ist falsch.";
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  return "Die Anmeldung ist fehlgeschlagen. Bitte versuche es später noch einmal.";
}

export function zeigeAnmeldung(container) {
  // Die Beschriftungen stehen fest im Code, deshalb ist innerHTML hier unkritisch.
  container.innerHTML = `
    <form class="formular" id="anmeldung" novalidate>
      <h1>Anmelden</h1>
      <div class="fehler" id="fehler" role="alert" hidden></div>

      <label for="email">E-Mail</label>
      <input id="email" name="email" type="email" autocomplete="email" required />

      <label for="passwort">Passwort</label>
      <input id="passwort" name="password" type="password" autocomplete="current-password" required />

      <button class="button" type="submit">Anmelden</button>
      <p class="formular-hinweis">Noch kein Konto? <a href="#/registrieren">Jetzt registrieren</a></p>
    </form>
  `;

  const formular = container.querySelector("#anmeldung");
  const fehlerBox = container.querySelector("#fehler");
  const knopf = formular.querySelector("button");
  const passwortFeld = formular.querySelector("#passwort");

  function zeigeFehler(text) {
    fehlerBox.textContent = text;   // textContent, weil der Text nie als HTML gelten soll
    fehlerBox.hidden = false;
  }

  formular.addEventListener("submit", async (ereignis) => {
    ereignis.preventDefault();       // verhindert, dass der Browser die Seite neu lädt
    fehlerBox.hidden = true;

    // Eingaben aus dem Formular lesen. Die Namen der Felder entsprechen der API.
    const daten = Object.fromEntries(new FormData(formular));

    const fehler = findeAnmeldefehler(daten);
    if (fehler.length > 0) {
      zeigeFehler(fehler.join(" "));
      return;
    }

    knopf.disabled = true;           // verhindert doppeltes Absenden
    try {
      const antwort = await meldeAn(daten);
      speichereToken(antwort.token);  // das Token ist ab jetzt der "Ausweis" für geschützte Aufrufe
      location.hash = "#/";           // löst hashchange aus: Der Router zeigt die Startseite, das Menü zeigt "Abmelden"
    } catch (fehlerAntwort) {
      zeigeFehler(uebersetzeAnmeldefehler(fehlerAntwort.status));
      passwortFeld.value = "";       // das Passwort wird nach einem Fehler zurückgesetzt
      knopf.disabled = false;
    }
  });
}