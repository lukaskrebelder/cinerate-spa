// Ansicht: Registrierung (US-2, Use Case 1).
// Ablauf: Eingaben wird geprüft -> an das BFF senden -> Bestätigung oder Fehlermeldung anzeigen.
import { registriereNutzer } from "../api.js";
import { findeRegistrierungsfehler } from "../validierung.js";

// Übersetzt den Statuscode einer Fehlerantwort in einen deutschen Text für den Nutzer.
// Die Texte des Servers sind englisch, deshalb wird nach dem Statuscode entschieden.
export function uebersetzeFehler(status) {
  if (status === 400) return "Bitte prüfe deine Eingaben.";
  if (status === 409) return "Mit dieser E-Mail-Adresse gibt es bereits ein Konto.";
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  return "Die Registrierung ist fehlgeschlagen. Bitte versuche es später noch einmal.";
}

// Ersetzt das Formular durch die Bestätigung nach erfolgreicher Registrierung.
function zeigeErfolg(container) {
  const box = document.createElement("div");
  box.className = "erfolg";

  const ueberschrift = document.createElement("h1");
  ueberschrift.textContent = "Konto erstellt";

  const text = document.createElement("p");
  text.textContent = "Dein Konto wurde angelegt. Du kannst dich jetzt anmelden.";

  const link = document.createElement("a");
  link.className = "button";
  link.href = "#/anmelden";
  link.textContent = "Zur Anmeldung";

  box.append(ueberschrift, text, link);
  container.replaceChildren(box);
}

export function zeigeRegistrierung(container) {
  // novalidate schaltet die Prüfung des Browsers ab, damit unsere deutschen Meldungen erscheinen.
  container.innerHTML = `
    <form class="formular" id="registrierung" novalidate>
      <h1>Registrieren</h1>
      <div class="fehler" id="fehler" role="alert" hidden></div>

      <label for="vorname">Vorname</label>
      <input id="vorname" name="firstName" type="text" autocomplete="given-name" required />

      <label for="nachname">Nachname</label>
      <input id="nachname" name="lastName" type="text" autocomplete="family-name" required />

      <label for="email">E-Mail</label>
      <input id="email" name="email" type="email" autocomplete="email" required />

      <label for="passwort">Passwort (mindestens 8 Zeichen)</label>
      <input id="passwort" name="password" type="password" autocomplete="new-password" required />

      <button class="button" type="submit">Konto erstellen</button>
    </form>
  `;

  const formular = container.querySelector("#registrierung");
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

    const fehler = findeRegistrierungsfehler(daten);
    if (fehler.length > 0) {
      zeigeFehler(fehler.join(" "));
      return;
    }

    knopf.disabled = true;           // verhindert doppeltes Absenden
    try {
      await registriereNutzer(daten);
      zeigeErfolg(container);
    } catch (fehlerAntwort) {
      zeigeFehler(uebersetzeFehler(fehlerAntwort.status));
      passwortFeld.value = "";       // Use Case: Die Passworteingabe wird zurückgesetzt
      knopf.disabled = false;
    }
  });
}