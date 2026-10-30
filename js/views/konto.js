// Ansicht: Mein Konto
// Dort kann der Nutzer sein Konto löschen. Vorher gibt es eine Sicherheitsabfrage.
import { holeUserId, loescheToken } from "../auth.js";
import { loescheKonto } from "../api.js";
import { zeigeNavigation } from "../navigation.js";

// Übersetzt den Statuscode einer Fehlerantwort in einen deutschen Text für den Nutzer.
// 401 (Sitzung abgelaufen) gehört nicht dazu: Dann wechselt die SPA schon zur Anmeldung.
export function uebersetzeLoeschfehler(status) {
  if (status === 403) return "Dieses Konto kannst du nicht löschen.";
  if (status === 0 || status === 502 || status === 503) {
    return "Der Server ist gerade nicht erreichbar. Bitte versuche es später noch einmal.";
  }
  return "Das Konto konnte nicht gelöscht werden. Bitte versuche es später noch einmal.";
}

// Ersetzt die Seite durch die Bestätigung nach dem Löschen.
function zeigeErfolg(container) {
  const box = document.createElement("div");
  box.className = "erfolg";

  const ueberschrift = document.createElement("h1");
  ueberschrift.textContent = "Konto gelöscht";

  const text = document.createElement("p");
  text.textContent = "Dein Konto und alle dazugehörigen Daten wurden gelöscht.";

  const link = document.createElement("a");
  link.className = "button";
  link.href = "#/";
  link.textContent = "Zur Startseite";

  box.append(ueberschrift, text, link);
  container.replaceChildren(box);
}

export function zeigeKonto(container) {
  // Die Beschriftungen stehen fest im Code, deshalb ist innerHTML hier unkritisch.
  container.innerHTML = `
    <section class="konto">
      <h1>Mein Konto</h1>
      <h2>Konto löschen</h2>
      <p>Beim Löschen werden dein Konto und alle dazugehörigen Daten (Bewertungen, Kommentare, Watchlist)
         unwiderruflich gelöscht.</p>

      <div class="hinweis" id="hinweis" role="status" hidden></div>
      <div class="fehler" id="fehler" role="alert" hidden></div>

      <div id="loeschen-start">
        <button class="button gefahr" type="button" id="loeschen">Konto löschen</button>
      </div>

      <div id="loeschen-bestaetigung" hidden>
        <p><strong>Bist du sicher, dass du dein Konto löschen willst?</strong> Die Löschung des Kontos ist irreversibel.</p>
        <button class="button gefahr" type="button" id="bestaetigen">Ja, Konto endgültig löschen</button>
        <button class="button" type="button" id="abbrechen">Abbrechen</button>
      </div>
    </section>
  `;

  const hinweisBox = container.querySelector("#hinweis");
  const fehlerBox = container.querySelector("#fehler");
  const startBereich = container.querySelector("#loeschen-start");
  const bestaetigungBereich = container.querySelector("#loeschen-bestaetigung");
  const loeschenKnopf = container.querySelector("#loeschen");
  const bestaetigenKnopf = container.querySelector("#bestaetigen");
  const abbrechenKnopf = container.querySelector("#abbrechen");

  // Ohne gespeicherte ID (zB. bei einer Anmeldung vor dieser Funktion) geht das Löschen nicht.
  // Nach einer neuen Anmeldung ist sie da.
  const userId = holeUserId();
  if (userId === null) {
    startBereich.hidden = true;
    hinweisBox.textContent = "Bitte melde dich einmal ab und wieder an, dann kannst du dein Konto hier löschen.";
    hinweisBox.hidden = false;
    return;
  }

  loeschenKnopf.addEventListener("click", () => {
    fehlerBox.hidden = true;
    startBereich.hidden = true;
    bestaetigungBereich.hidden = false;
  });

  abbrechenKnopf.addEventListener("click", () => {
    fehlerBox.hidden = true;
    bestaetigungBereich.hidden = true;
    startBereich.hidden = false;
  });

  bestaetigenKnopf.addEventListener("click", async () => {
    fehlerBox.hidden = true;
    bestaetigenKnopf.disabled = true;     // verhindert doppeltes Absenden
    abbrechenKnopf.disabled = true;

    try {
      await loescheKonto(userId);
      loescheToken();                     // das Konto gibt es nicht mehr, also auch keine Sitzung
      zeigeNavigation();                  // Menü neu aufbauen: Es zeigt wieder Anmelden und Registrieren
      zeigeErfolg(container);
    } catch (fehler) {
      // Bei 401 hat der Sitzungshandler schon zur Anmeldung gewechselt, hier ist nichts mehr zu zeigen
      if (fehler.status === 401) return;
      fehlerBox.textContent = uebersetzeLoeschfehler(fehler.status);   // textContent, weil der Text nie als HTML gelten soll
      fehlerBox.hidden = false;
      bestaetigenKnopf.disabled = false;
      abbrechenKnopf.disabled = false;
    }
  });
}