//--> Tests mithilfe von CLAUDE Sonnet 5.5 (zeitliche Gründe)

// Unit-Tests für den Umgang mit einer abgelaufenen Sitzung in js/api.js (PB-12).
// Bei geschützten Aufrufen (geschuetzt: true) wird der Sitzungshandler aufgerufen, wenn
// das Token fehlt oder das BFF mit 401 antwortet.
import test from "node:test";
import assert from "node:assert";
import { anfrage, setzeSitzungsHandler, ApiFehler } from "../js/api.js";
import { speichereToken } from "../js/auth.js";

// Baut eine Antwort, wie fetch sie liefert (ok, status und json()).
function antwort(status, inhalt) {
  return { ok: status >= 200 && status < 300, status, json: async () => inhalt };
}

// Führt die Prüfung mit einem Ersatz für localStorage (optional mit Token), einem Ersatz für fetch
// und einem Sitzungshandler aus, der mitzählt. Danach ist alles wieder wie vorher.
async function mitSitzung({ token, antwortStatus }, pruefung) {
  const speicher = new Map();
  const originalSpeicher = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
      setItem: (k, v) => speicher.set(k, String(v)),
      removeItem: (k) => speicher.delete(k),
    },
  });
  if (token) speichereToken(token);

  const originalFetch = globalThis.fetch;
  let fetchAufrufe = 0;
  globalThis.fetch = async () => {
    fetchAufrufe += 1;
    return antwort(antwortStatus, antwortStatus === 200 ? { ok: true } : { message: "Invalid token." });
  };

  let handlerAufrufe = 0;
  setzeSitzungsHandler(() => {
    handlerAufrufe += 1;
  });

  try {
    await pruefung({ handlerAufrufe: () => handlerAufrufe, fetchAufrufe: () => fetchAufrufe });
  } finally {
    setzeSitzungsHandler(() => {});
    globalThis.fetch = originalFetch;
    if (originalSpeicher) Object.defineProperty(globalThis, "localStorage", originalSpeicher);
    else delete globalThis.localStorage;
  }
}

test("Ein geschützter Aufruf mit 401 ruft den Sitzungshandler auf und wirft einen ApiFehler", async () => {
  await mitSitzung({ token: "abgelaufen", antwortStatus: 401 }, async (zaehler) => {
    await assert.rejects(anfrage("/geheim", { geschuetzt: true }), (fehler) => {
      assert.ok(fehler instanceof ApiFehler);
      assert.strictEqual(fehler.status, 401);
      return true;
    });
    assert.strictEqual(zaehler.handlerAufrufe(), 1);
  });
});

test("Ein geschützter Aufruf ohne Token ruft den Handler auf, ohne das BFF zu fragen", async () => {
  await mitSitzung({ token: null, antwortStatus: 200 }, async (zaehler) => {
    await assert.rejects(anfrage("/geheim", { geschuetzt: true }), (fehler) => {
      assert.strictEqual(fehler.status, 401);
      return true;
    });
    assert.strictEqual(zaehler.handlerAufrufe(), 1);
    assert.strictEqual(zaehler.fetchAufrufe(), 0);
  });
});

test("Ein geschützter Aufruf mit gültigem Token ruft den Handler nicht auf", async () => {
  await mitSitzung({ token: "gueltig", antwortStatus: 200 }, async (zaehler) => {
    const ergebnis = await anfrage("/geheim", { geschuetzt: true });
    assert.deepStrictEqual(ergebnis, { ok: true });
    assert.strictEqual(zaehler.handlerAufrufe(), 0);
  });
});

test("Ein normaler Aufruf mit 401 (z. B. falsches Passwort) ruft den Handler nicht auf", async () => {
  await mitSitzung({ token: "alt", antwortStatus: 401 }, async (zaehler) => {
    await assert.rejects(anfrage("/auth", { methode: "POST", daten: {} }), (fehler) => {
      assert.strictEqual(fehler.status, 401);
      return true;
    });
    assert.strictEqual(zaehler.handlerAufrufe(), 0);
  });
});

test("Ein geschützter Aufruf mit anderem Fehlerstatus (z. B. 500) ruft den Handler nicht auf", async () => {
  await mitSitzung({ token: "gueltig", antwortStatus: 500 }, async (zaehler) => {
    await assert.rejects(anfrage("/geheim", { geschuetzt: true }), (fehler) => {
      assert.strictEqual(fehler.status, 500);
      return true;
    });
    assert.strictEqual(zaehler.handlerAufrufe(), 0);
  });
});